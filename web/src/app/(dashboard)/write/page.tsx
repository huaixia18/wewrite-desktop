"use client";

import { usePipelineStore, PIPELINE_STEPS } from "@/store/pipeline";
import { cn } from "@/lib/utils";
import { Zap, MousePointer, SkipForward, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

/* ─── Apple Pipeline Page ──────────────────────────────────────────────
 * Black header section, light gray body
 * Apple step pills with blue active state
 * Clean mode switcher, minimal chrome
 */
const modeConfig = {
  auto: {
    label: "自动模式",
    icon: Zap,
    description: "全流程自动执行",
    color: "#f97316",
  },
  interactive: {
    label: "交互模式",
    icon: MousePointer,
    description: "关键节点暂停",
    color: "#f59e0b",
  },
  step: {
    label: "逐步模式",
    icon: SkipForward,
    description: "每步确认后继续",
    color: "#8b5cf6",
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
    currentStep,
    runMode,
    isRunning,
    article,
    progressText,
    setRunMode,
    startRun,
    stopRun,
    resetPipeline,
  } = usePipelineStore();

  const CurrentStepComponent = stepComponents[currentStep - 1];

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7]">
      {/* ── Black Header ── */}
      <div className="bg-black text-white shrink-0">
        {/* Top control bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
          {/* Mode switcher */}
          <div className="flex items-center gap-3">
            <span
              className="text-[12px] font-medium tracking-[-0.12px] text-white/40"
            >
              运行模式
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[980px] border px-3 py-1.5",
                  "text-[12px] font-medium tracking-[-0.12px] transition-all",
                  "border-white/[0.15] hover:border-white/[0.25]",
                  "bg-white/[0.06] hover:bg-white/[0.1]",
                  "text-white"
                )}
                style={{
                  color: modeConfig[runMode].color,
                  borderColor: `${modeConfig[runMode].color}30`,
                  backgroundColor: `${modeConfig[runMode].color}10`,
                }}
              >
                {(() => {
                  const Icon = modeConfig[runMode].icon;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {modeConfig[runMode].label}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                {(
                  Object.entries(modeConfig) as [
                    typeof runMode,
                    (typeof modeConfig)[typeof runMode]
                  ][]
                ).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setRunMode(key)}
                      className={cn(
                        "gap-2.5 text-[14px] py-2",
                        runMode === key
                          ? "bg-[#0071e3]/8 text-[#0071e3]"
                          : "text-[#1d1d1f]"
                      )}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                      <span className="font-medium">{cfg.label}</span>
                      <span className="text-[12px] text-[rgba(0,0,0,0.32)] ml-auto">
                        {cfg.description}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] tracking-[-0.12px] text-white/30">
              {progressText}
            </span>

            {!isRunning ? (
              <Button
                size="pill-sm"
                className="gap-1.5 h-8 px-4 text-[13px] font-medium"
                onClick={startRun}
              >
                <Play className="h-3.5 w-3.5" />
                开始写作
              </Button>
            ) : (
              <Button
                size="pill-sm"
                variant="outline"
                className="gap-1.5 h-8 px-4 text-[13px] font-medium border-white/20 text-white hover:bg-white/10"
                onClick={stopRun}
              >
                <Square className="h-3.5 w-3.5" />
                暂停
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator — Apple pill style */}
        <div className="flex items-center gap-1 px-6 py-4 overflow-x-auto scrollbar-none">
          {PIPELINE_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-[980px]",
                        "text-[13px] font-medium tracking-[-0.224px]",
                        "transition-all duration-200 cursor-pointer",
                        "outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-1",
                        isActive &&
                          "bg-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.4)]",
                        isDone &&
                          "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]",
                        !isActive &&
                          !isDone &&
                          "bg-transparent text-white/30 hover:text-white/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] font-mono tabular-nums",
                          isActive && "opacity-80"
                        )}
                      >
                        {step.id}
                      </span>
                      <span>{step.name}</span>
                      {isDone && (
                        <span className="ml-0.5 opacity-60">✓</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#1d1d1f] text-white border-0 max-w-[200px]"
                  >
                    <p className="text-[12px] font-medium">{step.description}</p>
                  </TooltipContent>
                </Tooltip>

                {index < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-4 mx-1 shrink-0",
                      isDone ? "bg-white/30" : "bg-white/[0.08]"
                    )}
                  />
                )}
              </div>
            );
          })}

          {/* Article title chip */}
          {article.title && (
            <div className="ml-auto flex items-center gap-2 shrink-0 max-w-[220px]">
              <Separator
                orientation="vertical"
                className="h-5 bg-white/10 mr-1"
              />
              <span className="text-[12px] tracking-[-0.12px] text-white/50 truncate">
                {article.title}
              </span>
              <Badge
                variant="secondary"
                className="shrink-0 text-[11px] bg-white/[0.08] text-white/60 border-0"
              >
                {article.wordCount ?? 0}字
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-auto">
        {CurrentStepComponent ? (
          <CurrentStepComponent />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[17px] text-[rgba(0,0,0,0.32)]">
              请选择一个步骤开始
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
