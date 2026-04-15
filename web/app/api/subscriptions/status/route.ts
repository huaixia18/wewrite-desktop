import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PRO_FEATURES } from "@/lib/subscription";

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

  const isActive =
    user.subscriptionTier === "pro" &&
    ["active", "canceled"].includes(user.subscriptionStatus) &&
    (user.subscriptionStatus !== "canceled" ||
      (user.subscriptionEndsAt && user.subscriptionEndsAt > new Date()));

  return NextResponse.json({
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    isActive,
    endsAt: user.subscriptionEndsAt?.toISOString() ?? null,
    hasStripe: !!user.stripeCustomerId,
    features: {
      free: Object.keys(PRO_FEATURES),
      pro: [],
    },
  });
}
