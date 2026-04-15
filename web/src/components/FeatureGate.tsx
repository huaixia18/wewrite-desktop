"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureGateProps {
  children: React.ReactNode;
  feature: "coverImage" | "seoDeep" | "wechatPublish" | "bulkGenerate" | "analytics";
  /** 如果用户已登录但不是 Pro，提示升级 */
  showUpgrade?: boolean;
  className?: string;
}

const FEATURE_LABELS: Record<FeatureGateProps["feature"], string> = {
  coverImage: "封面图生成",
  seoDeep: "SEO 深度分析",
  wechatPublish: "微信发布",
  bulkGenerate: "批量生成",
  analytics: "数据复盘",
};

const FEATURE_DESCS: Record<FeatureGateProps["feature"], string> = {
  coverImage: "AI 生成文章封面图，让阅读量提升 40%+",
  seoDeep: "一键获取关键词布局、标题优化、标签建议",
  wechatPublish: "直接推送至微信公众号草稿箱，一键发布",
  bulkGenerate: "批量生成多篇文章，效率提升 10 倍",
  analytics: "接入微信数据，追踪阅读量、点赞、留言趋势",
};

export function FeatureGate({ children, feature, showUpgrade = true, className }: FeatureGateProps) {
  const { data: session } = useSession();

  // TODO: 从 API 或 session 读取真实订阅状态
  // 暂时返回 children（无门控），上线前改为真实检查
  // const isPro = session?.user?.subscriptionTier === "pro";

  return (
    <div className={cn("relative", className)}>
      {children}
      {/* 门控提示（上线时取消注释） */}
      {/* {!isPro && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center z-10">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-black/8 max-w-xs text-center">
            <div className="w-10 h-10 bg-[#0071e3]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-[#0071e3]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#1d1d1f]">{FEATURE_LABELS[feature]}</h3>
            <p className="text-[13px] text-[rgba(0,0,0,0.48)] mt-1.5 leading-relaxed">
              {FEATURE_DESCS[feature]}
            </p>
            {showUpgrade && (
              <Link href="/pricing" className="mt-4 block">
                <Button variant="pill-filled" size="pill-sm" className="w-full gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  升级 Pro 解锁
                </Button>
              </Link>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}
