"use client";

import { useCallback, useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import { ChevronRight, CheckCircle2, Loader2, Sparkles, ArrowLeft } from "lucide-react";

/* ─── Apple Step: Topic ───────────────────────────────────────────────── */
const frameworkColors: Record<string, { color: string; bg: string }> = {
  痛点型: { color: "#334155", bg: "bg-slate-100" },
  故事型: { color: "#334155", bg: "bg-slate-100" },
  清单型: { color: "#334155", bg: "bg-slate-100" },
  对比型: { color: "#334155", bg: "bg-slate-100" },
  热点解读型: { color: "#334155", bg: "bg-slate-100" },
  纯观点型: { color: "#334155", bg: "bg-slate-100" },
  复盘型: { color: "#334155", bg: "bg-slate-100" },
};

interface TopicStepProps {
  onBackToHotspots?: () => void;
}

export function TopicStep({ onBackToHotspots }: TopicStepProps) {
  const {
    selectedHotspots,
    topics,
    selectedTopic,
    setTopics,
    setSelectedTopic,
    setProgressText,
    currentStep,
    nextStep,
    markStepDone,
    setCurrentStep,
    setRuntime,
  } = usePipelineStore();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const generateTopics = useCallback(async () => {
    if (selectedHotspots.length === 0) return;
    setError("");
    setGenerating(true);
    setProgressText("正在分析热点、生成选题...");
    try {
      const data = await fetchJson<{
        topics: Array<{
          id: string;
          title: string;
          score: number;
          clickPotential: number;
          seoScore: number;
          framework: string;
          keywords: string[];
          reason: string;
        }>;
        meta?: { mode?: "live"; provider?: string };
      }>("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotspots: selectedHotspots }),
      });
      const generated = data.topics ?? [];
      setTopics(generated);
      const preservedSelection = generated.find(
        (item) => item.id === selectedTopic?.id && item.title === selectedTopic?.title
      );
      setSelectedTopic(preservedSelection ?? generated[0] ?? null);
      setRuntime({
        aiMode: data.meta?.mode ?? "unknown",
        aiProvider: data.meta?.provider ?? "未检测",
      });
      setProgressText(`生成了 ${generated.length} 个选题`);
      if (generated.length > 0) {
        markStepDone();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "选题生成失败";
      setError(message);
      setProgressText("选题生成失败");
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }, [
    selectedHotspots,
    selectedTopic?.id,
    selectedTopic?.title,
    setTopics,
    setSelectedTopic,
    setProgressText,
    markStepDone,
    setRuntime,
  ]);

  useEffect(() => {
    if (currentStep === 2 && selectedHotspots.length > 0 && topics.length === 0) {
      generateTopics();
    }
  }, [currentStep, selectedHotspots.length, topics.length, generateTopics]);

  // 缓存命中时也标记完成
  useEffect(() => {
    if (currentStep === 2 && topics.length > 0) {
      markStepDone();
    }
  }, [currentStep, topics.length, markStepDone]);

  const handleNext = () => {
    if (!selectedTopic) return;
    nextStep();
  };

  return (
    <div className="max-w-[960px] mx-auto px-8 py-8 space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="saas-title text-[30px] leading-[1.14]">
            选题分析
          </h2>
          <p className="saas-muted text-[14px] tracking-[-0.224px] mt-1">
            基于选中的热点生成备选选题，综合评估点击潜力、SEO 友好度和框架适配
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {topics.length > 0 && (
            <Badge className="text-[12px] font-medium tracking-[-0.12px] bg-blue-50 text-blue-600 border-0">
              {topics.length} 个备选
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={generateTopics}
            disabled={generating || selectedHotspots.length === 0}
            className="h-9 gap-1.5 border-slate-200 text-[14px]"
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

      {/* Selected hotspots summary */}
      {error && (
        <StepStatusAlert
          variant="error"
          title="选题生成失败"
          description={error}
          actionLabel="重新生成"
          onAction={() => void generateTopics()}
        />
      )}

      {selectedHotspots.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-[rgba(0,0,0,0.32)]">基于热点：</span>
          {selectedHotspots.map((h) => (
            <Badge
              key={h.id}
              variant="outline"
              className="text-[11px] tracking-[-0.12px] bg-slate-100 text-slate-600 border-0 max-w-[200px] truncate"
            >
              {h.title}
            </Badge>
          ))}
        </div>
      )}

      {/* Selected topic tag */}
      {selectedTopic && (
        <div className="flex items-center gap-2">
            <Badge className="text-[12px] font-medium tracking-[-0.12px] bg-blue-50 text-blue-600 border-0">
              已选：{selectedTopic.framework}
            </Badge>
        </div>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[112px] rounded-2xl bg-white/60 animate-pulse" />
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
                  "saas-card transition-all duration-200 cursor-pointer",
                  "hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-blue-500/35"
                    : "ring-1 ring-slate-200"
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
                            ? "border-slate-300 bg-slate-100"
                            : "border-slate-300"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.35] text-slate-900">
                      {topic.title}
                    </p>

                    {/* Score bars */}
                    <div className="flex items-center gap-5 mt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)] w-6">点击</span>
                        <Progress value={topic.clickPotential * 20} className="w-[60px] h-[3px]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)] w-6">SEO</span>
                        <Progress value={topic.seoScore * 10} className="w-[60px] h-[3px]" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[rgba(0,0,0,0.32)]">综合</span>
                        <span
                          className={cn(
                            "text-[14px] font-bold font-mono",
                            topic.score >= 80
                              ? "text-slate-800"
                              : topic.score >= 60
                              ? "text-slate-700"
                              : "text-slate-400"
                          )}
                        >
                          {topic.score}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {topic.id.startsWith("evergreen-") && (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium tracking-[-0.12px] border-0 bg-emerald-50 text-emerald-700"
                        >
                          常青
                        </Badge>
                      )}
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
                          className="text-[11px] tracking-[-0.12px] bg-slate-100 text-slate-500 border-0"
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>

                    {/* Reason */}
                    <p className="text-[13px] tracking-[-0.224px] text-slate-500 mt-2 leading-[1.5]">
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
              {selectedHotspots.length === 0 ? "请先选择热点" : "暂无选题"}
            </p>
            <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
              {selectedHotspots.length === 0
                ? "返回热点抓取步骤，选中热点后再进入选题"
                : "点击上方刷新按钮重新生成"}
            </p>
          </div>
          {selectedHotspots.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onBackToHotspots) {
                  onBackToHotspots();
                  return;
                }
                setCurrentStep(1);
              }}
              className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px]"
            >
              <ArrowLeft className="h-4 w-4" />
              返回热点抓取
            </Button>
          )}
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
