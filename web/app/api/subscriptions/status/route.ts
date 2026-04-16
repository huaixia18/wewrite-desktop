import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PRO_FEATURES, resolveSubscriptionTier } from "@/lib/subscription";
import { getFreeTierModelCatalog } from "@/lib/ai-models";

/**
 * GET /api/subscriptions/status
 * 获取当前用户的订阅状态及可用功能
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const tier = resolveSubscriptionTier(user);
  const isActive = tier === "pro";

  return NextResponse.json({
    tier,
    status: user.subscriptionStatus,
    isActive,
    endsAt: user.subscriptionEndsAt?.toISOString() ?? null,
    hasStripe: !!user.stripeCustomerId,
    features: {
      free: ["热点挖掘", "AI 写作", "基础模型访问（mini / nano / haiku）"],
      pro: Object.values(PRO_FEATURES),
    },
    modelAccess: {
      free: {
        openai: getFreeTierModelCatalog("openai"),
        anthropic: getFreeTierModelCatalog("anthropic"),
      },
      pro: "all",
    },
  });
}
