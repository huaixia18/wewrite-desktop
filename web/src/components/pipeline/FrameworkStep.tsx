"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
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
    color: "#ea0d11",
    bg: "bg-[#ea0d11]/6",
    ring: "ring-[#ea0d11]/30",
  },
  {
    id: "故事型",
    emoji: "📖",
    desc: "以真实故事切入，逐步展开观点",
    suitable: "人物、文化、情感",
    color: "#7c3aed",
    bg: "bg-[#7c3aed]/6",
    ring: "ring-[#7c3aed]/30",
  },
  {
    id: "清单型",
    emoji: "📋",
    desc: "数字列表结构，信息密度高",
    suitable: "教程、技巧、方法论",
    color: "#16a34a",
    bg: "bg-[#16a34a]/6",
    ring: "ring-[#16a34a]/30",
  },
  {
    id: "对比型",
    emoji: "⚖️",
    desc: "A vs B，通过对比揭示真相",
    suitable: "评测、选品、行业分析",
    color: "#0071e3",
    bg: "bg-[#0071e3]/6",
    ring: "ring-[#0071e3]/30",
  },
  {
    id: "热点解读型",
    emoji: "🔥",
    desc: "对热点事件快速解读，给出独特角度",
    suitable: "新闻、热点、时评",
    color: "#f59e0b",
    bg: "bg-[#f59e0b]/6",
    ring: "ring-[#f59e0b]/30",
  },
  {
    id: "纯观点型",
    emoji: "💡",
    desc: "一个核心观点贯穿全文，论证严密",
    suitable: "评论、思想、深度",
    color: "#6b7280",
    bg: "bg-[#6b7280]/6",
    ring: "ring-[#6b7280]/30",
  },
  {
    id: "复盘型",
    emoji: "🔍",
    desc: "复盘经验教训，干货沉淀",
    suitable: "创业、项目、职业",
    color: "#0891b2",
    bg: "bg-[#0891b2]/6",
    ring: "ring-[#0891b2]/30",
  },
];

const strategies = [
  {
    id: "角度发现",
    desc: "从独特角度切入，避免同质化",
    emoji: "🔎",
    color: "#0071e3",
  },
  {
    id: "密度强化",
    desc: "提高信息密度，让读者有收获感",
    emoji: "📊",
    color: "#0071e3",
  },
  {
    id: "细节锚定",
    desc: "用真实细节替代空泛描述",
    emoji: "🎯",
    color: "#0071e3",
  },
  {
    id: "真实体感",
    desc: "增加真实体验、感受、情绪",
    emoji: "🌡️",
    color: "#0071e3",
  },
];

export function FrameworkStep() {
  const {
    selectedFramework,
    selectedStrategy,
    setFramework,
    setStrategy,
    selectedTopic,
    nextStep,
  } = usePipelineStore();

  const [step, setStep] = useState<"framework" | "strategy">("framework");

  const handleNext = () => {
    if (step === "framework") {
      if (!selectedFramework) return;
      setStep("strategy");
    } else {
      if (!selectedStrategy) return;
      nextStep();
    }
  };

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]"
        >
          {step === "framework" ? "选择框架" : "选择增强策略"}
        </h2>
        <p
          className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1"
        >
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
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "px-4 py-1.5 rounded-[980px] text-[13px] font-semibold tracking-[-0.224px]",
                  "transition-all duration-200",
                  step === s
                    ? "bg-[#0071e3] text-white"
                    : i < (step === "framework" ? 0 : 1)
                    ? "bg-[#0071e3]/10 text-[#0071e3]"
                    : "bg-[#f5f5f7] text-[rgba(0,0,0,0.32)]"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {frameworks.map((fw) => {
            const isSelected = selectedFramework === fw.id;
            const isRecommended = selectedTopic?.framework === fw.id;

            return (
              <div
                key={fw.id}
                className={cn(
                  "bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200",
                  "hover:shadow-[rgba(0,0,0,0.08)_0_2px_12px_0px]",
                  isSelected
                    ? `ring-2 ${fw.ring}`
                    : "ring-1 ring-black/[0.06]"
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
                    <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1 leading-[1.4]">
                      {fw.desc}
                    </p>
                    <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.32)] mt-1.5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {strategies.map((s) => {
            const isSelected = selectedStrategy === s.id;

            return (
              <div
                key={s.id}
                className={cn(
                  "bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200",
                  "hover:shadow-[rgba(0,0,0,0.08)_0_2px_12px_0px]",
                  isSelected
                    ? "ring-2 ring-[#0071e3]"
                    : "ring-1 ring-black/[0.06]"
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
                    <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
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
      <div className="flex items-center justify-between pt-2">
        {step === "strategy" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("framework")}
            className="gap-1 h-9 text-[14px] text-[rgba(0,0,0,0.48)]"
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
