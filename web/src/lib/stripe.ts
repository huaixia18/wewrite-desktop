import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY is not set — payment features will be unavailable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// ─── Price IDs（需在 Stripe Dashboard 创建）───────────────────────────────
// Monthly:  STRIPE_PRO_MONTHLY_PRICE_ID=price_...
// Yearly:   STRIPE_PRO_YEARLY_PRICE_ID=price_...

export const STRIPE_PRO_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_pro_monthly";

export const STRIPE_PRO_YEARLY_PRICE_ID =
  process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly";

export const PRO_MONTHLY_PRICE = 99;  // ¥99/月
export const PRO_YEARLY_PRICE = 799;   // ¥799/年
export const PRO_MONTHLY_PRICE_DISPLAY = "¥99/月";
export const PRO_YEARLY_PRICE_DISPLAY = "¥799/年";
