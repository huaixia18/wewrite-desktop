"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, CheckCircle2 } from "lucide-react";

const frameworks = [
  {
    id: "痛点型",
    emoji: "😰",
    desc: "先抛出痛点/焦虑，再给解决方案",
    suitable: "科技、职场、商业",
    color: "border-red-200 bg-red-50/50",
    activeColor: "border-red-400 bg-red-50",
  },
  {
    id: "故事型",
    emoji: "📖",
    desc: "以真实故事切入，逐步展开观点",
    suitable: "人物、文化、情感",
    color: "border-purple-200 bg-purple-50/50",
    activeColor: "border-purple-400 bg-purple-50",
  },
  {
    id: "清单型",
    emoji: "📋",
    desc: "数字列表结构，信息密度高",
    suitable: "教程、技巧、方法论",
    color: "border-green-200 bg-green-50/50",
    activeColor: "border-green-400 bg-green-50",
  },
  {
    id: "对比型",
    emoji: "⚖️",
    desc: "A vs B，通过对比揭示真相",
    suitable: "评测、选品、行业分析",
    color: "border-blue-200 bg-blue-50/50",
    activeColor: "border-blue-400 bg-blue-50",
  },
  {
    id: "热点解读型",
    emoji: "🔥",
    desc: "对热点事件快速解读，给出独特角度",
    suitable: "新闻、热点、时评",
    color: "border-orange-200 bg-orange-50/50",
    activeColor: "border-orange-400 bg-orange-50",
  },
  {
    id: "纯观点型",
    emoji: "💡",
    desc: "一个核心观点贯穿全文，论证严密",
    suitable: "评论、思想、深度",
    color: "border-gray-200 bg-gray-50/50",
    activeColor: "border-gray-400 bg-gray-50",
  },
  {
    id: "复盘型",
    emoji: "🔍",
    desc: "复盘经验教训，干货沉淀",
    suitable: "创业、项目、职业",
    color: "border-teal-200 bg-teal-50/50",
    activeColor: "border-teal-400 bg-teal-50",
  },
];

const strategies = [
  { id: "角度发现", desc: "从独特角度切入，避免同质化", emoji: "🔎" },
  { id: "密度强化", desc: "提高信息密度，让读者有收获感", emoji: "📊" },
  { id: "细节锚定", desc: "用真实细节替代空泛描述", emoji: "🎯" },
  { id: "真实体感", desc: "增加真实体验、感受、情绪", emoji: "🌡️" },
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {step === "framework" ? "选择框架" : "选择增强策略"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {step === "framework"
            ? `为「${selectedTopic?.title}」选择最适合的文章结构`
            : "选择文章的核心增强方向，决定写作重点"}
        </p>
      </div>

      {/* 步骤切换 */}
      <div className="flex items-center gap-2">
        {["framework", "strategy"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-medium transition-colors",
                step === s
                  ? "bg-blue-500 text-white"
                  : i < ["framework", "strategy"].indexOf(step)
                  ? "bg-blue-100 text-blue-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}. {s === "framework" ? "框架" : "增强策略"}
            </div>
            {i < 1 && <div className="h-px w-6 bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* 框架选择 */}
      {step === "framework" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {frameworks.map((fw) => {
            const isSelected = selectedFramework === fw.id;
            const isRecommended = selectedTopic?.framework === fw.id;
            return (
              <Card
                key={fw.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? `${fw.activeColor} ring-2 ring-offset-1`
                    : fw.color
                )}
                onClick={() => setFramework(fw.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{fw.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">{fw.id}</span>
                        {isRecommended && (
                          <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-[10px]">
                            AI推荐
                          </Badge>
                        )}
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{fw.desc}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        适用：{fw.suitable}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 增强策略选择 */}
      {step === "strategy" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strategies.map((s) => {
            const isSelected = selectedStrategy === s.id;
            return (
              <Card
                key={s.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                    : "border-border"
                )}
                onClick={() => setStrategy(s.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">{s.id}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 下一步 */}
      <div className="flex justify-end pt-2 gap-2">
        {step === "strategy" && (
          <Button variant="outline" onClick={() => setStep("framework")}>
            返回
          </Button>
        )}
        <Button
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          disabled={step === "framework" ? !selectedFramework : !selectedStrategy}
          onClick={handleNext}
        >
          {step === "framework" ? "下一步" : "开始写作"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
