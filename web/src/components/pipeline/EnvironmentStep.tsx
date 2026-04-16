"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Settings2, WandSparkles, Wrench } from "lucide-react";

interface OnboardingState {
  aiConfigured: boolean;
  styleConfigured: boolean;
  wechatConfigured: boolean;
  wechatRequired: boolean;
}

interface EnvironmentStepProps {
  onboarding: OnboardingState;
}

export function EnvironmentStep({ onboarding }: EnvironmentStepProps) {
  const { markStepDone, setCurrentStep, setProgressText } = usePipelineStore();
  const requiredChecks = [
    onboarding.aiConfigured,
    onboarding.styleConfigured,
    ...(onboarding.wechatRequired ? [onboarding.wechatConfigured] : []),
  ];
  const isReady = requiredChecks.every(Boolean);

  useEffect(() => {
    if (isReady) {
      markStepDone();
      setProgressText("环境检查完成");
    }
  }, [isReady, markStepDone, setProgressText]);

  return (
    <div className="mx-auto w-full max-w-[1260px] px-5 py-6 lg:px-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-[32px] font-semibold tracking-[-0.32px] leading-[1.08] text-[#1d1d1f]">
              环境检查
            </h2>
            <p className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.52)] mt-1.5">
              确认 AI 服务与默认写作风格已就绪，微信授权可后续再配置
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/settings?tab=ai"
              className="rounded-2xl border border-black/[0.06] bg-white p-4 transition-colors hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                <Wrench className="h-4 w-4 text-[#0071e3]" />
                AI 服务
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[rgba(0,0,0,0.52)]">
                {onboarding.aiConfigured ? <CheckCircle2 className="h-3.5 w-3.5 text-[#34c759]" /> : <Circle className="h-3.5 w-3.5" />}
                {onboarding.aiConfigured ? "已就绪" : "待配置"}
              </div>
            </Link>
            <Link
              href="/settings?tab=style"
              className="rounded-2xl border border-black/[0.06] bg-white p-4 transition-colors hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                <WandSparkles className="h-4 w-4 text-[#0071e3]" />
                写作风格
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[rgba(0,0,0,0.52)]">
                {onboarding.styleConfigured ? <CheckCircle2 className="h-3.5 w-3.5 text-[#34c759]" /> : <Circle className="h-3.5 w-3.5" />}
                {onboarding.styleConfigured ? "已配置默认风格" : "建议先配置"}
              </div>
            </Link>
            <Link
              href="/settings?tab=wechat"
              className="rounded-2xl border border-black/[0.06] bg-white p-4 transition-colors hover:bg-[#f8fafc]"
            >
              <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                <Settings2 className="h-4 w-4 text-[#0071e3]" />
                微信授权
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[rgba(0,0,0,0.52)]">
                {onboarding.wechatConfigured ? <CheckCircle2 className="h-3.5 w-3.5 text-[#34c759]" /> : <Circle className="h-3.5 w-3.5" />}
                {onboarding.wechatConfigured ? "已配置" : "可选，发布前再填"}
              </div>
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4">
            <Badge variant="outline" className="border-black/[0.08] bg-[#f5f5f7] text-[rgba(0,0,0,0.58)]">
              {isReady ? "环境已满足自动执行条件" : "环境未完全就绪，仍可继续"}
            </Badge>
            <Button
              variant="pill-filled"
              size="pill-sm"
              className="h-10 gap-1.5 px-5"
              onClick={() => {
                markStepDone();
                setCurrentStep(2);
              }}
            >
              进入选题
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border border-black/[0.06] bg-[#f8fafc] p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[rgba(0,0,0,0.42)]">
            状态面板
          </p>
          <div className="mt-3 space-y-2.5">
            <div className="rounded-xl border border-black/[0.05] bg-white px-3 py-2.5">
              <p className="text-[12px] text-[rgba(0,0,0,0.45)]">已完成检查</p>
              <p className="mt-1 text-[22px] font-semibold tracking-[-0.24px] text-[#1d1d1f]">
                {requiredChecks.filter(Boolean).length}/{requiredChecks.length}
              </p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-white px-3 py-2.5">
              <p className="text-[12px] text-[rgba(0,0,0,0.45)]">下一步</p>
              <p className="mt-1 text-[15px] font-medium tracking-[-0.16px] text-[#1d1d1f]">
                选题规划与热点抓取
              </p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-white px-3 py-2.5">
              <p className="text-[12px] text-[rgba(0,0,0,0.45)]">建议</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-[rgba(0,0,0,0.62)]">
                先完成 AI 与风格配置，再开始自动流程，稳定性更高。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
