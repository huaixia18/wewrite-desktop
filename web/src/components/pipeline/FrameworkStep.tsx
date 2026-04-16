"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronRight, CheckCircle2, ChevronLeft } from "lucide-react";

/* ─── Apple Step: Framework ────────────────────────────────────────────
 * Grid of Apple-style framework cards
 * Pill badges, white cards, blue active ring
 */
const frameworks = [
  {
    id: "痛点型",
    emoji: "😰",
    desc: "先抛出痛点/焦虑，再给解决方案",
    suitable: "科技、职场、商业",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "故事型",
    emoji: "📖",
    desc: "以真实故事切入，逐步展开观点",
    suitable: "人物、文化、情感",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "清单型",
    emoji: "📋",
    desc: "数字列表结构，信息密度高",
    suitable: "教程、技巧、方法论",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "对比型",
    emoji: "⚖️",
    desc: "A vs B，通过对比揭示真相",
    suitable: "评测、选品、行业分析",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "热点解读型",
    emoji: "🔥",
    desc: "对热点事件快速解读，给出独特角度",
    suitable: "新闻、热点、时评",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "纯观点型",
    emoji: "💡",
    desc: "一个核心观点贯穿全文，论证严密",
    suitable: "评论、思想、深度",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
  {
    id: "复盘型",
    emoji: "🔍",
    desc: "复盘经验教训，干货沉淀",
    suitable: "创业、项目、职业",
    color: "#334155",
    bg: "bg-slate-100",
    ring: "ring-blue-500/30",
  },
];

const strategies = [
  {
    id: "角度发现",
    desc: "从独特角度切入，避免同质化",
    emoji: "🔎",
    color: "#2563eb",
  },
  {
    id: "密度强化",
    desc: "提高信息密度，让读者有收获感",
    emoji: "📊",
    color: "#2563eb",
  },
  {
    id: "细节锚定",
    desc: "用真实细节替代空泛描述",
    emoji: "🎯",
    color: "#2563eb",
  },
  {
    id: "真实体感",
    desc: "增加真实体验、感受、情绪",
    emoji: "🌡️",
    color: "#2563eb",
  },
];

interface FrameworkStepProps {
  onComplete?: () => void;
  disableAutoComplete?: boolean;
}

export function FrameworkStep({
  onComplete,
  disableAutoComplete = false,
}: FrameworkStepProps) {
  const {
    selectedFramework,
    selectedStrategy,
    setFramework,
    setStrategy,
    selectedTopic,
    nextStep,
    markStepDone,
    runMode,
  } = usePipelineStore();

  const [step, setStep] = useState<"framework" | "strategy">("framework");

  // Auto-select recommended framework and strategy in auto mode
  useEffect(() => {
    if (runMode === "auto" && selectedTopic) {
      if (!selectedFramework && selectedTopic.framework) {
        setFramework(selectedTopic.framework);
      }
      if (!selectedStrategy) {
        setStrategy("角度发现");
      }
    }
  }, [runMode, selectedTopic, selectedFramework, selectedStrategy, setFramework, setStrategy]);

  // Signal done when both framework and strategy are selected
  useEffect(() => {
    if (!disableAutoComplete && selectedFramework && selectedStrategy) {
      markStepDone();
    }
  }, [disableAutoComplete, selectedFramework, selectedStrategy, markStepDone]);

  const handleNext = () => {
    if (step === "framework") {
      if (!selectedFramework) return;
      setStep("strategy");
    } else {
      if (!selectedStrategy) return;
      if (onComplete) {
        onComplete();
        return;
      }
      nextStep();
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-7 space-y-6 lg:h-full lg:flex lg:flex-col lg:space-y-0 lg:gap-6">
      {/* Header */}
      <div>
        <h2 className="saas-title text-[30px] leading-[1.14]">
          {step === "framework" ? "选择框架" : "选择增强策略"}
        </h2>
        <p className="saas-muted text-[14px] tracking-[-0.224px] mt-1">
          {step === "framework"
            ? `为「${selectedTopic?.title}」选择最适合的文章结构`
            : "选择文章的核心增强方向，决定写作重点"}
        </p>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-2">
        {(["framework", "strategy"] as const).map((s, i) => {
          const label = i === 0 ? "框架" : "增强策略";
          return (
            <div key={s} className="flex items-center shrink-0">
              <div
                className={cn(
                  "px-4 py-1.5 rounded-[980px] text-[13px] font-semibold tracking-[-0.224px] whitespace-nowrap shrink-0",
                  "transition-all duration-200",
                  step === s
                    ? "bg-[#0071e3] text-white"
                    : i < (step === "framework" ? 0 : 1)
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {i + 1}. {label}
              </div>
              {i < 1 && <Separator className="w-6 h-px mx-1 bg-[rgba(0,0,0,0.08)]" />}
            </div>
          );
        })}
      </div>

      {/* Framework grid */}
      {step === "framework" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {frameworks.map((fw) => {
            const isSelected = selectedFramework === fw.id;
            const isRecommended = selectedTopic?.framework === fw.id;

            return (
              <div
                key={fw.id}
                className={cn(
                  "saas-card p-5 cursor-pointer transition-all duration-200",
                  "hover:shadow-md",
                  isSelected
                    ? `ring-2 ${fw.ring}`
                    : "ring-1 ring-slate-200"
                )}
                onClick={() => setFramework(fw.id)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-[32px] leading-none mt-0.5">{fw.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f]"
                      >
                        {fw.id}
                      </span>
                      {isRecommended && (
                        <Badge className="text-[11px] font-medium tracking-[-0.12px] bg-[#ff9500]/10 text-[#ff9500] border-0">
                          AI推荐
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#0071e3] ml-auto" />
                      )}
                    </div>
                    <p className="text-[13px] tracking-[-0.224px] text-slate-500 mt-1 leading-[1.5]">
                      {fw.desc}
                    </p>
                    <p className="text-[12px] tracking-[-0.12px] text-slate-400 mt-1.5">
                      适用：{fw.suitable}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategy grid */}
      {step === "strategy" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {strategies.map((s) => {
            const isSelected = selectedStrategy === s.id;

            return (
              <div
                key={s.id}
                className={cn(
                  "saas-card p-5 cursor-pointer transition-all duration-200",
                  "hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-[#0071e3]"
                    : "ring-1 ring-slate-200"
                )}
                onClick={() => setStrategy(s.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[32px] leading-none">{s.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                        {s.id}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#0071e3] ml-auto" />
                      )}
                    </div>
                    <p className="text-[13px] tracking-[-0.224px] text-slate-500 mt-1">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 lg:pt-0">
        {step === "strategy" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("framework")}
            className="gap-1 h-9 text-[14px] text-slate-500"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>
        )}
        <div className="ml-auto">
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-1.5 h-10 px-5"
            disabled={
              step === "framework" ? !selectedFramework : !selectedStrategy
            }
            onClick={handleNext}
          >
            {step === "framework" ? "下一步" : "开始写作"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
