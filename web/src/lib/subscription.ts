import { prisma } from "@/lib/prisma";

export type SubscriptionTier = "free" | "pro";

/**
 * 获取用户的订阅等级
 */
export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) return "free";

  // 已取消但未到期，仍视为 pro
  if (user.subscriptionTier === "pro" && user.subscriptionStatus === "canceled") {
    if (user.subscriptionEndsAt && user.subscriptionEndsAt > new Date()) {
      return "pro";
    }
    return "free";
  }

  if (user.subscriptionTier === "pro" && user.subscriptionStatus === "active") {
    return "pro";
  }

  return "free";
}

/**
 * 判断用户是否有 Pro 功能权限
 */
export async function isProUser(userId: string): Promise<boolean> {
  return (await getSubscriptionTier(userId)) === "pro";
}

// ─── Pro 功能列表 ─────────────────────────────────────────────────────────

export const PRO_FEATURES = {
  coverImage: "AI 封面图生成（每月 20 张）",
  seoDeep: "SEO 深度分析",
  wechatPublish: "微信草稿箱一键发布",
  bulkGenerate: "批量文章生成（最多 10 篇/批次）",
  analytics: "阅读数据复盘与分析",
  priorityQueue: "优先 AI 处理队列",
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;
