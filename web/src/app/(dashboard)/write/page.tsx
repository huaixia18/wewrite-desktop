"use client";

import { usePipelineStore, PIPELINE_STEPS } from "@/store/pipeline";
import { cn } from "@/lib/utils";
import { Zap, MousePointer, SkipForward, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const modeConfig = {
  auto: {
    label: "自动模式",
    icon: Zap,
    description: "全流程自动执行",
    color: "text-blue-500 bg-blue-500/10",
  },
  interactive: {
    label: "交互模式",
    icon: MousePointer,
    description: "关键节点暂停",
    color: "text-amber-500 bg-amber-500/10",
  },
  step: {
    label: "逐步模式",
    icon: SkipForward,
    description: "每步确认后继续",
    color: "text-purple-500 bg-purple-500/10",
  },
};

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
    <div className="flex flex-col h-full">
      {/* 顶部进度条 */}
      <div className="border-b shrink-0">
        {/* 模式切换栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">运行模式</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 px-2 text-[11px] gap-1">
                {(() => {
                  const Icon = modeConfig[runMode].icon;
                  return <Icon className="h-3 w-3" />;
                })()}
                {modeConfig[runMode].label}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(Object.entries(modeConfig) as [typeof runMode, typeof modeConfig.auto][]).map(
                  ([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => setRunMode(key)}
                        className={cn("gap-2 text-[13px]", runMode === key && "bg-accent")}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {cfg.description}
                        </span>
                      </DropdownMenuItem>
                    );
                  }
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* 进度文本 */}
            <span className="text-[12px] text-muted-foreground">
              {progressText}
            </span>

            {/* 运行/停止按钮 */}
            {!isRunning ? (
              <Button
                size="sm"
                className="h-7 gap-1 text-[12px] bg-blue-500 hover:bg-blue-600"
                onClick={startRun}
              >
                <Play className="h-3 w-3" />
                开始写作
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-[12px]"
                onClick={stopRun}
              >
                <Square className="h-3 w-3" />
                暂停
              </Button>
            )}
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-0 px-4 py-3">
          {PIPELINE_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;
            return (
              <div key={step.id} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer text-[12px] font-medium",
                        isActive && "bg-blue-500 text-white shadow-sm",
                        isDone && "bg-blue-500/20 text-blue-600",
                        !isActive && !isDone && "text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] font-mono opacity-70">{step.id}</span>
                      <span>{step.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[12px]">{step.description}</p>
                  </TooltipContent>
                </Tooltip>

                {index < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-6 mx-0.5",
                      isDone ? "bg-blue-500" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}

          {/* 文章标题缩略 */}
          {article.title && (
            <div className="ml-auto flex items-center gap-2 max-w-[200px]">
              <span className="text-[12px] text-muted-foreground truncate">
                {article.title}
              </span>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {article.wordCount ?? 0}字
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 步骤内容区 */}
      <div className="flex-1 overflow-auto">
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>
    </div>
  );
}
