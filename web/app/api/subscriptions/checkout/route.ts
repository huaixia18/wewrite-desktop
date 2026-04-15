import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/subscriptions/checkout
 * 创建 Stripe Checkout Session（支付宝 / 微信支付 / 信用卡）
 *
 * Body:
 *   plan: "monthly" | "yearly"
 *
 * Returns: { url: string } — 重定向到 Stripe Checkout
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { plan } = await req.json();
  const isYearly = plan === "yearly";
  const priceId = isYearly ? STRIPE_PRO_YEARLY_PRICE_ID : STRIPE_PRO_MONTHLY_PRICE_ID;

  // 查找或创建 Stripe Customer
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, nickname: true },
  });

  let customerId = user?.stripeCustomerId;

  if (!customerId && user?.email) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.nickname ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  if (!customerId) {
    return NextResponse.json({ error: "无法创建支付会话，请联系客服" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card", "alipay", "wechat_pay"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${baseUrl}/settings?subscription=success`,
    cancel_url: `${baseUrl}/pricing`,
    locale: "auto",
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
