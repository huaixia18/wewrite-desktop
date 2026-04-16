"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PIPELINE_STEPS, usePipelineStore } from "@/store/pipeline";
import type { HumanizerReport } from "@/store/pipeline";
import { fetchJson } from "@/lib/http";
import { cn } from "@/lib/utils";
import {
  BarChart3,
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
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnvironmentStep } from "@/components/pipeline/EnvironmentStep";
import { TopicPlanningStep } from "@/components/pipeline/TopicPlanningStep";
import { FrameworkMaterialStep } from "@/components/pipeline/FrameworkMaterialStep";
import { WritingStep } from "@/components/pipeline/WritingStep";
import { HumanizerStep } from "@/components/pipeline/HumanizerStep";
import { SeoImageStep } from "@/components/pipeline/SeoImageStep";
import { PublishStep } from "@/components/pipeline/PublishStep";
import { WrapUpStep } from "@/components/pipeline/WrapUpStep";

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

const INTERACTIVE_CHECKPOINTS = [2, 3, 5, 6] as const;

interface SettingsOnboardingResponse {
  onboarding?: {
    aiConfigured?: boolean;
    styleConfigured?: boolean;
    wechatConfigured?: boolean;
    wechatRequired?: boolean;
  };
}

interface ArticleRecord {
  id: string;
  title: string;
  content?: string;
  framework?: string | null;
  enhanceStrategy?: string | null;
  keywords?: string[];
  seoTitle?: string | null;
  seoAbstract?: string | null;
  coverImageUrl?: string | null;
  coverPrompt?: string | null;
  mediaId?: string | null;
  wordCount?: number | null;
  humanizerReport?: HumanizerReport | null;
  topicSource?: unknown;
  updatedAt?: string | null;
}

interface DraftResponse {
  article?: ArticleRecord;
  articles?: ArticleRecord[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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
  const [restoreMessage, setRestoreMessage] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const restoreAttemptedRef = useRef(false);
  const [onboarding, setOnboarding] = useState({
    aiConfigured: false,
    styleConfigured: false,
    wechatConfigured: false,
    wechatRequired: false,
  });

  // ── Run orchestrator ──────────────────────────────────────────────────
  const advancingRef = useRef(false);
  useEffect(() => {
    if (!isRunning || !stepDone) return;
    if (advancingRef.current) return;
    if (runMode === "step") return;
    if (currentStep >= PIPELINE_STEPS.length) return;

    const shouldPauseAtCheckpoint =
      runMode === "interactive" &&
      INTERACTIVE_CHECKPOINTS.includes(currentStep as (typeof INTERACTIVE_CHECKPOINTS)[number]);

    advancingRef.current = true;
    if (shouldPauseAtCheckpoint) {
      stopRun();
    } else {
      nextStep();
    }
    // Reset guard after a tick so it can fire again on next step
    setTimeout(() => {
      advancingRef.current = false;
    }, 100);
  }, [currentStep, isRunning, nextStep, runMode, stepDone, stopRun]);

  useEffect(() => {
    let cancelled = false;

    const loadOnboarding = async () => {
      try {
        const data = await fetchJson<SettingsOnboardingResponse>("/api/settings/ai");
        if (cancelled) return;
        if (data?.onboarding) {
          setOnboarding({
            aiConfigured: Boolean(data.onboarding.aiConfigured),
            styleConfigured: Boolean(data.onboarding.styleConfigured),
            wechatConfigured: Boolean(data.onboarding.wechatConfigured),
            wechatRequired: Boolean(data.onboarding.wechatRequired),
          });
        }
        setOnboardingError("");
      } catch (error) {
        if (cancelled) return;
        setOnboardingError(getErrorMessage(error, "引导状态加载失败"));
      }
    };

    void loadOnboarding();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    restoreAttemptedRef.current = false;
  }, [draftId]);

  useEffect(() => {
    if (restoreAttemptedRef.current) return;

    if (article.content?.trim()) {
      restoreAttemptedRef.current = true;
      return;
    }

    restoreAttemptedRef.current = true;
    if (article.content?.trim()) return;

    let canceled = false;

    const restoreDraft = async () => {
      setRestoreError("");
      try {
        const endpoint = draftId
          ? `/api/articles?id=${encodeURIComponent(draftId)}`
          : "/api/articles?status=draft&page=1&limit=1&includeContent=1";

        const data = await fetchJson<DraftResponse>(endpoint);
        const latest = draftId ? data.article : data.articles?.[0];
        if (!latest || canceled) return;

        if (!article.content?.trim()) {
          const restoredTopic = latest.topicSource as Parameters<typeof setSelectedTopic>[0] | undefined;
          setArticle({
            id: latest.id,
            title: latest.title,
            content: latest.content ?? "",
            framework: latest.framework ?? undefined,
            enhanceStrategy: latest.enhanceStrategy ?? undefined,
            keywords: latest.keywords ?? [],
            topic: restoredTopic ?? undefined,
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
          if (restoredTopic) {
            setSelectedTopic(restoredTopic);
          }
          if (latest.updatedAt) {
            setCloudSyncAt(latest.updatedAt);
          }
          setRestoreMessage(draftId ? "已加载你选中的草稿" : "已自动恢复最近云端草稿");
        }
      } catch (error) {
        if (canceled) return;
        setRestoreError(
          getErrorMessage(error, draftId ? "加载草稿失败，请稍后重试" : "自动恢复草稿失败")
        );
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

  const current = PIPELINE_STEPS[currentStep - 1];
  const completedSteps = currentStep - 1;
  const progress = Math.round((completedSteps / PIPELINE_STEPS.length) * 100);
  const wordCount = article.wordCount ?? article.content?.replace(/[#*`>\n]/g, "").length ?? 0;
  const isInteractiveCheckpoint =
    runMode === "interactive" &&
    INTERACTIVE_CHECKPOINTS.includes(currentStep as (typeof INTERACTIVE_CHECKPOINTS)[number]);
  const canAdvanceManually =
    stepDone &&
    currentStep < PIPELINE_STEPS.length &&
    (runMode === "step" || isInteractiveCheckpoint);
  const nextStepLabel = PIPELINE_STEPS[currentStep]?.name ?? "下一步";
  const onboardingChecks = [
    onboarding.aiConfigured,
    onboarding.styleConfigured,
    ...(onboarding.wechatRequired ? [onboarding.wechatConfigured] : []),
  ];
  const onboardingDoneCount = onboardingChecks.filter(Boolean).length;
  const onboardingRequiredCount = onboardingChecks.length;
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <EnvironmentStep onboarding={onboarding} />;
      case 2:
        return <TopicPlanningStep />;
      case 3:
        return <FrameworkMaterialStep />;
      case 4:
        return <WritingStep />;
      case 5:
        return <HumanizerStep />;
      case 6:
        return <SeoImageStep />;
      case 7:
        return <PublishStep />;
      case 8:
        return <WrapUpStep />;
      default:
        return null;
    }
  };
  const stepContent = renderStepContent();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        Boolean(target?.isContentEditable) ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select";
      if (isEditable) return;

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (isRunning) {
          stopRun();
        } else {
          startRun();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetPipeline();
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "." &&
        canAdvanceManually
      ) {
        event.preventDefault();
        setCurrentStep(currentStep + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    currentStep,
    isRunning,
    resetPipeline,
    setCurrentStep,
    startRun,
    stepDone,
    stopRun,
    canAdvanceManually,
  ]);

  return (
    <div className="saas-shell min-h-screen pb-24 lg:pb-8">
      <section className="px-4 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-[1580px] rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.06)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  写作流程
                </p>
                <h1 className="mt-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.5px] text-slate-900">
                  当前阶段：{current.name}
                </h1>
                <p className="mt-1.5 text-[14px] leading-[1.55] tracking-[-0.12px] text-slate-500">
                  {current.description}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:min-w-[320px]">
                <div className="rounded-xl border border-blue-200/70 bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-blue-500">步骤</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-blue-700">
                    {currentStep.toString().padStart(2, "0")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-500">进度</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-slate-800">{progress}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-500">字数</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-slate-800">{wordCount}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.58)]">
                  {progressText}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium tracking-[-0.224px] text-slate-800">
                    {(() => {
                      const Icon = modeConfig[runMode].icon;
                      return <Icon className="h-4 w-4 text-[#0071e3]" />;
                    })()}
                    {modeConfig[runMode].label}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[260px] rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-sm"
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
                            selected ? "bg-slate-100 text-slate-800" : "text-slate-800"
                          )}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium tracking-[-0.224px]">
                              {config.label}
                            </p>
                            <p className="mt-1 text-[12px] leading-[1.4] tracking-[-0.12px] text-slate-500">
                              {config.description}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {article.title && (
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] tracking-[-0.224px] text-slate-600">
                    {article.title}
                  </div>
                )}
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-[12px] text-slate-600"
                >
                  AI：{runtime.aiMode === "live" ? `真实服务（${runtime.aiProvider}）` : "待检测"}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-[12px] text-slate-600"
                >
                  发布：{runtime.publishMode === "live" ? "真实链路" : "待检测"}
                </Badge>
                {cloudSyncAt && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-500">
                    <Cloud className="h-3.5 w-3.5 text-slate-400" />
                    云端保存于 {new Date(cloudSyncAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 border-slate-200 bg-white px-4 text-slate-800 hover:bg-slate-100"
                  onClick={resetPipeline}
                >
                  <RotateCcw className="h-4 w-4" />
                  重新开始
                </Button>
                {canAdvanceManually && (
                  <Button
                    variant="outline"
                    className="h-10 border-slate-200 bg-white px-4 text-slate-800 hover:bg-slate-100"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    下一步：{nextStepLabel}
                  </Button>
                )}
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
                    className="h-10 border-slate-200 bg-white px-4 text-slate-800 hover:bg-slate-100"
                    onClick={stopRun}
                  >
                    <Square className="h-4 w-4" />
                    暂停流程
                  </Button>
                )}
              </div>
            </div>

            <p className="text-[11px] tracking-[-0.1px] text-slate-400">
              快捷键：`Ctrl/⌘ + Enter` 开始或暂停，`Ctrl/⌘ + Shift + R` 重置，`Ctrl/⌘ + .` 手动下一步
            </p>

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
                        "rounded-full px-3 py-2 text-left transition-all duration-200",
                        "focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? "bg-[#0071e3] text-white shadow-[0_6px_16px_rgba(0,113,227,0.35)]"
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

      <section className="pt-4">
        <div className="mx-auto w-full max-w-[1580px] px-4 md:px-6">
          {onboardingError && (
            <div className="mb-3">
              <StepStatusAlert
                variant="error"
                title="引导状态加载失败"
                description={onboardingError}
              />
            </div>
          )}

          {restoreMessage && (
            <div className="mb-3">
              <StepStatusAlert
                variant="success"
                title="草稿恢复成功"
                description={restoreMessage}
              />
            </div>
          )}

          {restoreError && (
            <div className="mb-3">
              <StepStatusAlert
                variant="error"
                title="草稿恢复失败"
                description={restoreError}
              />
            </div>
          )}

          {onboardingDoneCount < onboardingRequiredCount && (
            <div className="saas-panel mb-4 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="saas-title text-[17px]">
                    首次使用引导（约 3 分钟）
                  </p>
                  <p className="saas-muted mt-1 text-[13px] tracking-[-0.224px]">
                    检查 AI 服务状态，并确认默认写作风格后即可开始。微信授权可后续再配置。
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-slate-200 bg-slate-100 text-slate-600">
                  已完成 {onboardingDoneCount}/{onboardingRequiredCount}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link
                  href="/settings?tab=ai"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#1d1d1f]">
                    <Settings2 className="h-4 w-4 text-[#0071e3]" />
                    微信授权（可选）
                  </div>
                  <p className="mt-1 text-[12px] text-[rgba(0,0,0,0.48)]">
                    {onboarding.wechatConfigured ? "已完成" : "可跳过，发布前再配置"}
                  </p>
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <aside className="order-2 space-y-4 xl:order-2 xl:sticky xl:top-[84px] xl:self-start xl:pl-1">
            <div className="saas-panel border-slate-200/90 bg-[linear-gradient(165deg,#f8fbff_0%,#ffffff_56%)] p-5">
              <div className="flex items-center gap-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                <Workflow className="h-3.5 w-3.5 text-[#0071e3]" />
                工作摘要
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="rounded-[16px] border border-slate-200/80 bg-white p-3">
                  <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                    当前选题
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-[1.4] tracking-[-0.224px] text-[#1d1d1f]">
                    {selectedTopic?.title ?? "先完成热点与选题步骤"}
                  </p>
                </div>
                <div className="rounded-[16px] border border-slate-200/80 bg-white p-3">
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

            <div className="saas-panel border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <div className="flex items-center gap-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                <Layers3 className="h-3.5 w-3.5 text-[#0071e3]" />
                当前阶段
              </div>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.04] tracking-[-0.3px] text-[#1d1d1f]">
                {current.name}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                {current.description}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
              <div className="mt-4 rounded-[16px] bg-[#f5f5f7] p-3">
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

          <div className="saas-panel order-1 min-w-0 overflow-hidden border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] xl:min-h-[640px]">
            {stepContent ? (
              stepContent
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium tracking-[-0.16px] text-[#1d1d1f]">
              {currentStep.toString().padStart(2, "0")} · {current.name}
            </p>
            <p className="text-[11px] tracking-[-0.1px] text-[rgba(0,0,0,0.48)]">{progressText}</p>
          </div>
          <div className="flex items-center gap-2">
            {canAdvanceManually && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-slate-200 bg-white text-slate-800"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                下一步
              </Button>
            )}
            {!isRunning ? (
              <Button variant="pill-filled" size="sm" className="h-9 gap-1.5 px-4" onClick={startRun}>
                <Play className="h-4 w-4" />
                开始
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-9 border-slate-200 bg-white px-4 text-slate-800" onClick={stopRun}>
                <Square className="h-4 w-4" />
                暂停
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
