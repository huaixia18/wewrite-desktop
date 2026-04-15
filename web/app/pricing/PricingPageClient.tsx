"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRO_MONTHLY_PRICE = 99;
const PRO_YEARLY_PRICE = 799;
const YEARLY_SAVING = Math.round(
  ((PRO_MONTHLY_PRICE * 12 - PRO_YEARLY_PRICE) / (PRO_MONTHLY_PRICE * 12)) * 100
);

const FREE_FEATURES = [
  { label: "热点挖掘（微博 / 头条 / 百度）", included: true },
  { label: "AI 选题生成", included: true },
  { label: "AI 文章写作", included: true },
  { label: "Humanizer 去 AI 化", included: true },
  { label: "AI 封面图生成", included: false },
  { label: "SEO 深度分析", included: false },
  { label: "微信草稿箱一键发布", included: false },
  { label: "批量文章生成", included: false },
  { label: "阅读数据复盘", included: false },
  { label: "优先 AI 处理队列", included: false },
];

const PRO_FEATURES = [
  { label: "热点挖掘（微博 / 头条 / 百度）", included: true },
  { label: "AI 选题生成", included: true },
  { label: "AI 文章写作", included: true },
  { label: "Humanizer 去 AI 化", included: true },
  { label: "AI 封面图生成（20 张 / 月）", included: true },
  { label: "SEO 深度分析", included: true },
  { label: "微信草稿箱一键发布", included: true },
  { label: "批量文章生成（10 篇 / 批次）", included: true },
  { label: "阅读数据复盘", included: true },
  { label: "优先 AI 处理队列", included: true },
];

interface Props {
  userId?: string;
}

export function PricingPageClient({ userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!userId) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <section className="px-4 pt-4 md:px-6">
        <div className="apple-container rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[rgba(0,0,0,0.04)_0_8px_20px_-12px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.42)]">Pricing</p>
              <h1 className="mt-1 text-[26px] font-semibold leading-[1.2] tracking-[-0.24px] text-[#0f172a]">
                订阅方案
              </h1>
              <p className="mt-1 text-[13px] leading-[1.5] tracking-[-0.12px] text-[rgba(0,0,0,0.52)]">
                免费版可跑通核心流程，Pro 负责把封面、SEO、发布能力一起补齐。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" className="bg-[#2563eb]/10 text-[#1d4ed8]">
                年付省 {YEARLY_SAVING}%
              </Badge>
              <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
                折合每月 ¥{Math.round(PRO_YEARLY_PRICE / 12)}
              </Badge>
              <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
                适合创作者与运营团队
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="apple-container grid gap-6 px-0 lg:grid-cols-2">
          <div className="apple-panel p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[0.08em] text-[rgba(0,0,0,0.38)]">
                  Free
                </p>
                <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f]">
                  免费版
                </h2>
                <p className="mt-2 text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                  适合先跑通一条内容工作流。
                </p>
              </div>
              <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.56)]">
                体验版
              </Badge>
            </div>

            <div className="mt-8">
              <span className="text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f]">
                ¥0
              </span>
              <span className="ml-2 text-[17px] tracking-[-0.374px] text-[rgba(0,0,0,0.48)]">
                / 永久
              </span>
            </div>

            <Link href={userId ? "/write" : "/login"} className="mt-8 inline-flex w-full">
              <Button variant="pill-outline" className="h-11 w-full justify-center text-[14px]">
                {userId ? "继续使用免费版" : "登录后开始体验"}
              </Button>
            </Link>

            <div className="mt-8 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  {feature.included ? (
                    <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#0071e3]" />
                  ) : (
                    <X className="h-[18px] w-[18px] shrink-0 text-[rgba(0,0,0,0.18)]" />
                  )}
                  <span
                    className={cn(
                      "text-[14px] tracking-[-0.224px]",
                      feature.included ? "text-[#1d1d1f]" : "text-[rgba(0,0,0,0.28)]"
                    )}
                  >
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-[#1d1d1f] p-6 text-white shadow-[rgba(0,0,0,0.22)_0_24px_48px_-30px] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] uppercase tracking-[0.08em] text-white/42">
                  Pro
                </p>
                <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-white">
                  全部功能
                </h2>
                <p className="mt-2 text-[14px] leading-[1.5] tracking-[-0.224px] text-white/56">
                  适合稳定输出、高频发布和想把流程全自动化的团队。
                </p>
              </div>
              <Badge className="border-0 bg-[#0071e3] text-white">推荐</Badge>
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5">
                <p className="text-[12px] tracking-[-0.12px] text-white/42">月付</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-[44px] font-semibold leading-[1.07] tracking-[-0.28px] text-white">
                    ¥{PRO_MONTHLY_PRICE}
                  </span>
                  <span className="pb-1 text-[15px] tracking-[-0.224px] text-white/48">
                    / 月
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="mt-5 h-11 w-full justify-center border-white/12 bg-transparent text-white hover:bg-white/[0.06]"
                  onClick={() => handleSubscribe("monthly")}
                  disabled={loading !== null}
                >
                  {loading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {loading === "monthly" ? "跳转支付..." : "月付开通"}
                </Button>
              </div>

              <div className="rounded-[24px] border border-[#0071e3]/24 bg-[#0071e3]/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] tracking-[-0.12px] text-white/56">年付</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-[44px] font-semibold leading-[1.07] tracking-[-0.28px] text-white">
                        ¥{PRO_YEARLY_PRICE}
                      </span>
                      <span className="pb-1 text-[15px] tracking-[-0.224px] text-white/56">
                        / 年
                      </span>
                    </div>
                  </div>
                  <Badge className="border-0 bg-white text-[#0071e3]">省 {YEARLY_SAVING}%</Badge>
                </div>

                <Button
                  variant="pill-filled"
                  className="mt-5 h-11 w-full justify-center text-[14px]"
                  onClick={() => handleSubscribe("yearly")}
                  disabled={loading !== null}
                >
                  {loading === "yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {loading === "yearly" ? "跳转支付..." : "年付开通"}
                </Button>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#2997ff]" />
                  <span className="text-[14px] tracking-[-0.224px] text-white/80">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="apple-container mt-10 grid gap-4 px-0 md:grid-cols-2">
          {[
            {
              q: "订阅后可以随时取消吗？",
              a: "可以。取消后直到当期结束前仍可继续使用 Pro 功能。",
            },
            {
              q: "年付和月付有什么区别？",
              a: "功能相同，年付更适合长期稳定产出的账号与团队。",
            },
            {
              q: "封面图和 SEO 有额度限制吗？",
              a: "封面图按月重置额度，SEO 与发布功能在 Pro 中默认开放。",
            },
            {
              q: "支持自己的 API Key 吗？",
              a: "支持。在设置页填入后，你可以按自己的模型与代理策略运行。",
            },
          ].map((item) => (
            <div key={item.q} className="apple-panel p-6">
              <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
                {item.q}
              </p>
              <p className="mt-2 text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
