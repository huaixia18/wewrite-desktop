import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

/**
 * POST /api/subscriptions/webhook
 * Stripe Webhook — 处理订阅事件
 *
 * 需要在 Stripe Dashboard 配置 Webhook URL:
 *   https://your-domain.com/api/subscriptions/webhook
 *
 * 监听事件：
 *   checkout.session.completed
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.payment_failed
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const subscriptionId = checkoutSession.subscription as string;

        if (!userId || !subscriptionId) break;

        // 从最新 invoice 取 period_end 作为到期时间
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["latest_invoice"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const latestInvoice = (subscription as any).latest_invoice as Stripe.Invoice | undefined;
        const endsAt = latestInvoice?.period_end
          ? new Date(latestInvoice.period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: "pro",
            subscriptionStatus: "active",
            subscriptionEndsAt: endsAt,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const isActive = ["active", "trialing"].includes(sub.status);
        // 从 subscription item 的 price interval 和 billing_cycle_anchor 推算到期时间
        const item = sub.items?.data?.[0];
        const price = item?.price;
        const interval = price?.recurring?.interval;
        const intervalCount = price?.recurring?.interval_count ?? 1;
        const anchor = sub.billing_cycle_anchor;

        let endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback
        if (anchor) {
          if (interval === "month") {
            endsAt = new Date((anchor + intervalCount * 30) * 1000);
          } else if (interval === "year") {
            endsAt = new Date((anchor + intervalCount * 365) * 1000);
          } else if (interval === "week") {
            endsAt = new Date((anchor + intervalCount * 7) * 1000);
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: isActive ? "pro" : "free",
            subscriptionStatus: sub.status,
            subscriptionEndsAt: endsAt,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "past_due" },
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
