"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

/* ─── Apple Step: Topic ─────────────────────────────────────────────────
 * Clean topic cards with Apple scoring
 * Pill badges, blue active state, minimal chrome
 */
const frameworkColors: Record<string, { color: string; bg: string }> = {
  痛点型: { color: "#ea0d11", bg: "bg-[#ea0d11]/10" },
  故事型: { color: "#7c3aed", bg: "bg-[#7c3aed]/10" },
  清单型: { color: "#16a34a", bg: "bg-[#16a34a]/10" },
  对比型: { color: "#0071e3", bg: "bg-[#0071e3]/10" },
  热点解读型: { color: "#f59e0b", bg: "bg-[#f59e0b]/10" },
  纯观点型: { color: "#6b7280", bg: "bg-[#6b7280]/10" },
  复盘型: { color: "#0891b2", bg: "bg-[#0891b2]/10" },
};

export function TopicStep() {
  const {
    hotspots,
    topics,
    selectedTopic,
    setTopics,
    setSelectedTopic,
    setProgressText,
    currentStep,
    nextStep,
  } = usePipelineStore();

  const [generating, setGenerating] = useState(false);

  const generateTopics = async () => {
    if (hotspots.length === 0) return;
    setGenerating(true);
    setProgressText("正在分析热点、生成选题...");
    try {
      const res = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotspots }),
      });
      const data = await res.json();
      setTopics(data.topics ?? []);
      setProgressText(`生成了 ${data.topics?.length ?? 0} 个选题`);
    } catch {
      setProgressText("选题生成失败");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && hotspots.length > 0 && topics.length === 0) {
      generateTopics();
    }
  }, [currentStep]);

  const handleNext = () => {
    if (!selectedTopic) return;
    nextStep();
  };

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]"
          >
            选题分析
          </h2>
          <p
            className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1"
          >
            基于热点生成备选选题，综合评估点击潜力、SEO 友好度和框架适配
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-[12px] font-medium tracking-[-0.12px] bg-[#f5f5f7] border-0 text-[rgba(0,0,0,0.48)]"
          >
            {topics.length} 个备选
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={generateTopics}
            disabled={generating}
            className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px]"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            重新选题
          </Button>
        </div>
      </div>

      {/* Selected tag */}
      {selectedTopic && (
        <div className="flex items-center gap-2">
          <Badge className="text-[12px] font-medium tracking-[-0.12px] bg-[#0071e3]/10 text-[#0071e3] border-0">
            已选：{selectedTopic.framework}
          </Badge>
        </div>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[112px] rounded-2xl bg-white/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Topic cards */}
      {!generating && topics.length > 0 && (
        <div className="space-y-2">
          {topics.map((topic, index) => {
            const isSelected = selectedTopic?.id === topic.id;
            const isTopScore = index < 2;
            const fwColor = frameworkColors[topic.framework] ?? {
              color: "#6b7280",
              bg: "bg-[#6b7280]/10",
            };

            return (
              <div
                key={topic.id}
                className={cn(
                  "bg-white rounded-2xl transition-all duration-200 cursor-pointer",
                  "hover:shadow-[rgba(0,0,0,0.08)_0_2px_12px_0px]",
                  isSelected
                    ? "ring-2 ring-[#0071e3]"
                    : "ring-1 ring-black/[0.06]"
                )}
                onClick={() => setSelectedTopic(topic)}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Selection indicator */}
                  <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="h-6 w-6 text-[#0071e3]" />
                    ) : (
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-colors",
                          isTopScore
                            ? "border-[#ff9500] bg-[#ff9500]/10"
                            : "border-[rgba(0,0,0,0.16)]"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p
                      className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.3] text-[#1d1d1f]"
                    >
                      {topic.title}
                    </p>

                    {/* Score bars */}
                    <div className="flex items-center gap-5 mt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)] w-6">点击</span>
                        <Progress
                          value={topic.clickPotential * 20}
                          className="w-[60px] h-[3px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)] w-6">SEO</span>
                        <Progress
                          value={topic.seoScore * 10}
                          className="w-[60px] h-[3px]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)]">综合</span>
                        <span
                          className={cn(
                            "text-[14px] font-bold font-mono",
                            topic.score >= 80
                              ? "text-[#ff3b30]"
                              : topic.score >= 60
                              ? "text-[#ff9500]"
                              : "text-[rgba(0,0,0,0.32)]"
                          )}
                        >
                          {topic.score}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium tracking-[-0.12px] border-0"
                        style={{ background: fwColor.bg, color: fwColor.color }}
                      >
                        {topic.framework}
                      </Badge>
                      {topic.keywords.slice(0, 3).map((kw) => (
                        <Badge
                          key={kw}
                          variant="outline"
                          className="text-[11px] tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0"
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>

                    {/* Reason */}
                    <p
                      className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-2 leading-[1.4]"
                    >
                      {topic.reason}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!generating && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-[rgba(0,0,0,0.12)]" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              暂无选题
            </p>
            <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
              点击上方刷新按钮重新生成
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      {selectedTopic && (
        <div className="flex justify-end pt-2">
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-1.5 h-10 px-5"
            onClick={handleNext}
          >
            选择框架
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
