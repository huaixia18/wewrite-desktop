"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PIPELINE_STEPS, usePipelineStore } from "@/store/pipeline";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Layers3,
  MousePointer,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Square,
  WandSparkles,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HotspotStep } from "@/components/pipeline/HotspotStep";
import { TopicStep } from "@/components/pipeline/TopicStep";
import { FrameworkStep } from "@/components/pipeline/FrameworkStep";
import { EnhanceStep } from "@/components/pipeline/EnhanceStep";
import { WritingStep } from "@/components/pipeline/WritingStep";
import { HumanizerStep } from "@/components/pipeline/HumanizerStep";
import { SeoImageStep } from "@/components/pipeline/SeoImageStep";
import { PublishStep } from "@/components/pipeline/PublishStep";

const modeConfig = {
  auto: {
    label: "自动模式",
    icon: Zap,
    description: "系统连续执行完整流程",
  },
  interactive: {
    label: "交互模式",
    icon: MousePointer,
    description: "关键节点停下来给你确认",
  },
  step: {
    label: "逐步模式",
    icon: SkipForward,
    description: "每一步都由你亲自推进",
  },
} as const;

const stepComponents = [
  HotspotStep,
  TopicStep,
  FrameworkStep,
  EnhanceStep,
  WritingStep,
  HumanizerStep,
  SeoImageStep,
  PublishStep,
];

export default function PipelinePage() {
  const {
    article,
    currentStep,
    isRunning,
    progressText,
    resetPipeline,
    runMode,
    selectedFramework,
    selectedStrategy,
    selectedTopic,
    setCurrentStep,
    setRunMode,
    setArticle,
    setFramework,
    setStrategy,
    setSelectedTopic,
    setCloudSyncAt,
    startRun,
    stopRun,
    stepDone,
    nextStep,
    runtime,
    cloudSyncAt,
  } = usePipelineStore();

  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const [restoringDraft, setRestoringDraft] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [onboarding, setOnboarding] = useState({
    aiConfigured: false,
    styleConfigured: false,
    wechatConfigured: false,
  });

  // ── Auto-mode orchestrator ────────────────────────────────────────────
  const advancingRef = useRef(false);
  useEffect(() => {
    if (!isRunning || runMode !== "auto" || !stepDone) return;
    if (advancingRef.current) return;
    advancingRef.current = true;
    nextStep();
    // Reset guard after a tick so it can fire again on next step
    setTimeout(() => {
      advancingRef.current = false;
    }, 100);
  }, [isRunning, runMode, stepDone, nextStep]);

  useEffect(() => {
    fetch("/api/settings/ai")
      .then((res) => res.json())
      .then((data) => {
        if (data?.onboarding) {
          setOnboarding({
            aiConfigured: Boolean(data.onboarding.aiConfigured),
            styleConfigured: Boolean(data.onboarding.styleConfigured),
            wechatConfigured: Boolean(data.onboarding.wechatConfigured),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (article.content?.trim()) return;

    let canceled = false;

    const restoreDraft = async () => {
      setRestoringDraft(true);
      try {
        const endpoint = draftId
          ? `/api/articles?id=${encodeURIComponent(draftId)}`
          : "/api/articles?status=draft&page=1&limit=1&includeContent=1";

        const res = await fetch(endpoint);
        const data = await res.json();
        const latest = draftId ? data.article : data.articles?.[0];
        if (!latest || canceled) return;

        if (!article.content?.trim()) {
          setArticle({
            id: latest.id,
            title: latest.title,
            content: latest.content ?? "",
            framework: latest.framework ?? undefined,
            enhanceStrategy: latest.enhanceStrategy ?? undefined,
            keywords: latest.keywords ?? [],
            seoTitle: latest.seoTitle ?? undefined,
            seoAbstract: latest.seoAbstract ?? undefined,
            coverImageUrl: latest.coverImageUrl ?? undefined,
            coverPrompt: latest.coverPrompt ?? undefined,
            mediaId: latest.mediaId ?? undefined,
            wordCount:
              latest.wordCount ??
              (latest.content ?? "").replace(/[#*`>\n]/g, "").length,
            humanizerReport: latest.humanizerReport ?? undefined,
          });
          setFramework(latest.framework ?? null);
          setStrategy(latest.enhanceStrategy ?? null);
          if (latest.topicSource) {
            setSelectedTopic(latest.topicSource as Parameters<typeof setSelectedTopic>[0]);
          }
          if (latest.updatedAt) {
            setCloudSyncAt(latest.updatedAt);
          }
          setRestoreMessage(draftId ? "已加载你选中的草稿" : "已自动恢复最近云端草稿");
        }
      } catch {
        // ignore restore errors
      } finally {
        if (!canceled) setRestoringDraft(false);
      }
    };

    void restoreDraft();

    return () => {
      canceled = true;
    };
  }, [
    article.content,
    draftId,
    setArticle,
    setCloudSyncAt,
    setFramework,
    setSelectedTopic,
    setStrategy,
  ]);

  const CurrentStepComponent = stepComponents[currentStep - 1];
  const current = PIPELINE_STEPS[currentStep - 1];
  const completedSteps = currentStep - 1;
  const progress = Math.round((completedSteps / PIPELINE_STEPS.length) * 100);
  const wordCount = article.wordCount ?? article.content?.replace(/[#*`>\n]/g, "").length ?? 0;
  const onboardingDoneCount = [
    onboarding.aiConfigured,
    onboarding.styleConfigured,
    onboarding.wechatConfigured,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <section className="px-4 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-[1180px] rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[rgba(0,0,0,0.04)_0_8px_20px_-12px] sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.42)]">
                  写作流程
                </p>
                <h1 className="mt-1 text-[26px] font-semibold leading-[1.18] tracking-[-0.24px] text-[#0f172a]">
                  当前阶段：{current.name}
                </h1>
                <p className="mt-1 text-[13px] leading-[1.5] tracking-[-0.12px] text-[rgba(0,0,0,0.52)]">
                  {current.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="soft" className="bg-[#2563eb]/10 text-[#1d4ed8]">
                  步骤 {currentStep.toString().padStart(2, "0")}
                </Badge>
                <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
                  进度 {progress}%
                </Badge>
                <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
                  字数 {wordCount}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[20px] border border-black/[0.06] bg-[#f8fafc] p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.58)]">
                  {progressText}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                    {(() => {
                      const Icon = modeConfig[runMode].icon;
                      return <Icon className="h-4 w-4 text-[#0071e3]" />;
                    })()}
                    {modeConfig[runMode].label}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[260px] rounded-[20px] border border-black/[0.06] bg-white p-2 text-[#1d1d1f] shadow-[rgba(0,0,0,0.16)_0_18px_36px_-28px]"
                  >
                    {(
                      Object.entries(modeConfig) as [
                        keyof typeof modeConfig,
                        (typeof modeConfig)[keyof typeof modeConfig]
                      ][]
                    ).map(([key, config]) => {
                      const Icon = config.icon;
                      const selected = key === runMode;

                      return (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => setRunMode(key)}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-[16px] px-3 py-3 text-left",
                            selected ? "bg-[#f5f5f7] text-[#1d1d1f]" : "text-[#1d1d1f]"
                          )}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium tracking-[-0.224px]">
                              {config.label}
                            </p>
                            <p className="mt-1 text-[12px] leading-[1.4] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                              {config.description}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {article.title && (
                  <div className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.62)]">
                    {article.title}
                  </div>
                )}
                <Badge
                  variant="outline"
                  className="border-black/[0.1] bg-white text-[12px] text-[rgba(0,0,0,0.62)]"
                >
                  AI：{runtime.aiMode === "live" ? `真实服务（${runtime.aiProvider}）` : runtime.aiMode === "mock" ? "Mock 模式" : "待检测"}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-black/[0.1] bg-white text-[12px] text-[rgba(0,0,0,0.62)]"
                >
                  发布：{runtime.publishMode === "live" ? "真实链路" : runtime.publishMode === "mock" ? "Beta 模拟" : "待检测"}
                </Badge>
                {cloudSyncAt && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] text-[rgba(0,0,0,0.56)]">
                    <Cloud className="h-3.5 w-3.5 text-[rgba(0,0,0,0.5)]" />
                    云端保存于 {new Date(cloudSyncAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 border-black/[0.1] bg-white px-4 text-[#1d1d1f] hover:bg-[#f3f4f6]"
                  onClick={resetPipeline}
                >
                  <RotateCcw className="h-4 w-4" />
                  重新开始
                </Button>
                {!isRunning ? (
                  <Button
                    variant="pill-filled"
                    className="h-10 gap-2 px-5 text-[14px]"
                    onClick={startRun}
                  >
                    <Play className="h-4 w-4" />
                    开始执行
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="h-10 border-black/[0.1] bg-white px-4 text-[#1d1d1f] hover:bg-[#f3f4f6]"
                    onClick={stopRun}
                  >
                    <Square className="h-4 w-4" />
                    暂停流程
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2">
                {PIPELINE_STEPS.map((step) => {
                  const active = step.id === currentStep;
                  const done = step.id < currentStep;

                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-left transition-all duration-200",
                        "focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? "bg-[#0071e3] text-white"
                          : done
                            ? "bg-[#e8f1ff] text-[#1d4ed8] hover:bg-[#dbeafe]"
                            : "bg-[#f5f5f7] text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.62)]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] tracking-[-0.12px] opacity-72">
                          {step.id.toString().padStart(2, "0")}
                        </span>
                        <span className="text-[13px] font-medium tracking-[-0.224px]">
                          {step.name}
                        </span>
                        {done && <span className="text-[12px] opacity-60">完成</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="mx-auto w-full max-w-[1180px] px-4 md:px-6">
          {(restoreMessage || restoringDraft) && (
            <div className="mb-6 rounded-[24px] border border-[#0071e3]/20 bg-[#0071e3]/6 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#0071e3]" />
                <p className="text-[14px] tracking-[-0.224px] text-[#005bb5]">
                  {restoringDraft ? "正在检查云端草稿..." : restoreMessage}
                </p>
              </div>
            </div>
          )}

          {onboardingDoneCount < 3 && (
            <div className="mb-6 rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[rgba(0,0,0,0.06)_0_4px_16px_-8px]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
                    首次使用引导（约 3 分钟）
                  </p>
                  <p className="mt-1 text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                    检查 AI 服务状态，并完成风格配置与微信授权后，写作和发布体验会更稳定。
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-black/[0.08] bg-[#f5f5f7] text-[rgba(0,0,0,0.56)]">
                  已完成 {onboardingDoneCount}/3
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link
                  href="/settings?tab=ai"
                  className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3 transition-colors hover:bg-[#ececf1]"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                    <Wrench className="h-4 w-4 text-[#0071e3]" />
                    AI 服务状态
                  </div>
                  <p className="mt-1 text-[12px] text-[rgba(0,0,0,0.48)]">
                    {onboarding.aiConfigured ? "已就绪（平台托管）" : "未就绪，请联系管理员"}
                  </p>
                </Link>
                <Link
                  href="/settings?tab=style"
                  className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3 transition-colors hover:bg-[#ececf1]"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                    <WandSparkles className="h-4 w-4 text-[#0071e3]" />
                    选择写作风格
                  </div>
                  <p className="mt-1 text-[12px] text-[rgba(0,0,0,0.48)]">
                    {onboarding.styleConfigured ? "已完成" : "建议完成，减少返工"}
                  </p>
                </Link>
                <Link
                  href="/settings?tab=wechat"
                  className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3 transition-colors hover:bg-[#ececf1]"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                    <Settings2 className="h-4 w-4 text-[#0071e3]" />
                    微信授权
                  </div>
                  <p className="mt-1 text-[12px] text-[rgba(0,0,0,0.48)]">
                    {onboarding.wechatConfigured ? "已完成" : "发布前建议完成"}
                  </p>
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[rgba(0,0,0,0.06)_0_4px_16px_-8px]">
              <div className="flex items-center gap-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                <Workflow className="h-3.5 w-3.5 text-[#0071e3]" />
                工作摘要
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                  <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                    当前选题
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-[1.4] tracking-[-0.224px] text-[#1d1d1f]">
                    {selectedTopic?.title ?? "先完成热点与选题步骤"}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                  <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                    写作结构
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="soft" className="bg-[#0071e3]/8 text-[#0071e3]">
                      {selectedFramework ?? "待选择框架"}
                    </Badge>
                    <Badge variant="outline" className="border-black/[0.08] bg-white text-[rgba(0,0,0,0.56)]">
                      {selectedStrategy ?? "待选择策略"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[rgba(0,0,0,0.06)_0_4px_16px_-8px]">
              <div className="flex items-center gap-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                <Layers3 className="h-3.5 w-3.5 text-[#0071e3]" />
                当前阶段
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                {current.name}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                {current.description}
              </p>
              <div className="mt-5 rounded-[20px] bg-[#f5f5f7] p-4">
                <div className="flex items-center justify-between text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                  <span>可推进到下一步</span>
                  <BarChart3 className="h-3.5 w-3.5 text-[#0071e3]" />
                </div>
                <p className="mt-2 text-[15px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                  完成当前内容后，继续到「
                  {PIPELINE_STEPS[Math.min(currentStep, PIPELINE_STEPS.length - 1)]?.name ?? current.name}
                  」
                </p>
              </div>
            </div>
          </aside>

          <div className="min-w-0 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[rgba(0,0,0,0.06)_0_4px_16px_-8px]">
            {CurrentStepComponent ? (
              <CurrentStepComponent />
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
                <p className="text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                  还没有可展示的步骤
                </p>
                <p className="mt-2 text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                  从第一个步骤开始，工作流会逐渐变得完整。
                </p>
                <Button
                  variant="pill-filled"
                  className="mt-6 h-10 px-5 text-[14px]"
                  onClick={() => setCurrentStep(1)}
                >
                  返回起点
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
