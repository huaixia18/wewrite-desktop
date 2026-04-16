"use client";

import { useCallback, useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronRight,
  Flame,
  TrendingUpIcon,
  CheckCircle2,
  Circle,
  CheckCheck,
} from "lucide-react";

/* ─── Apple Step: Hotspot ──────────────────────────────────────────────── */
const platformLabels: Record<string, { label: string; color: string; bg: string }> = {
  weibo: { label: "微博", color: "#475569", bg: "bg-slate-100" },
  toutiao: { label: "头条", color: "#475569", bg: "bg-slate-100" },
  baidu: { label: "百度", color: "#475569", bg: "bg-slate-100" },
};

const trendConfig = {
  rising: { icon: TrendingUp, label: "上升", color: "#334155" },
  stable: { icon: Minus, label: "持平", color: "#64748b" },
  fading: { icon: TrendingDown, label: "下降", color: "#64748b" },
};

interface HotspotStepProps {
  expectedStep?: number;
  onProceed?: () => void;
}

export function HotspotStep({ expectedStep = 1, onProceed }: HotspotStepProps) {
  const {
    hotspots,
    selectedHotspots,
    hotspotsLoading,
    setHotspots,
    setHotspotsLoading,
    setProgressText,
    currentStep,
    nextStep,
    markStepDone,
    toggleHotspot,
    selectAllHotspots,
    clearSelectedHotspots,
    setTopics,
    setSelectedTopic,
    setRuntime,
  } = usePipelineStore();

  const allSelected = hotspots.length > 0 && selectedHotspots.length === hotspots.length;
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const visibleHotspots = showAll ? hotspots : hotspots.slice(0, 8);

  const fetchHotspots = useCallback(async () => {
    if (currentStep !== expectedStep) return;
    setError("");
    setHotspotsLoading(true);
    setProgressText("正在抓取热点...");
    try {
      const data = await fetchJson<{
        hotspots: Array<{
          id: string;
          platform: "weibo" | "toutiao" | "baidu";
          title: string;
          score: number;
          url?: string;
          keywords: string[];
          trend: "rising" | "stable" | "fading";
        }>;
        meta?: { mode?: "live" };
      }>("/api/topics/hotspots");
      setHotspots((data.hotspots ?? []).map((hotspot) => ({ ...hotspot, url: hotspot.url ?? "" })));
      setRuntime({ hotspotMode: data.meta?.mode ?? "unknown" });
      setProgressText(`已抓取 ${data.hotspots?.length ?? 0} 条热点`);
      if ((data.hotspots ?? []).length > 0) {
        markStepDone();
      }
    } catch {
      setHotspots([]);
      setRuntime({ hotspotMode: "unknown" });
      setError("热点抓取失败，可能是网络或热点源暂不可用。");
      setProgressText("热点抓取失败，请检查网络");
      toast.error("热点抓取失败，请稍后重试");
    } finally {
      setHotspotsLoading(false);
    }
  }, [
    currentStep,
    expectedStep,
    markStepDone,
    setHotspots,
    setHotspotsLoading,
    setProgressText,
    setRuntime,
  ]);

  useEffect(() => {
    if (currentStep === expectedStep && hotspots.length === 0 && !hotspotsLoading) {
      void fetchHotspots();
    }
  }, [currentStep, expectedStep, fetchHotspots, hotspots.length, hotspotsLoading]);

  // 缓存命中时也标记完成
  useEffect(() => {
    if (currentStep === expectedStep && hotspots.length > 0) {
      markStepDone();
    }
  }, [currentStep, expectedStep, hotspots.length, markStepDone]);

  useEffect(() => {
    if (hotspots.length <= 8) {
      setShowAll(false);
    }
  }, [hotspots.length]);

  const handleNext = () => {
    if (selectedHotspots.length === 0) return;
    setTopics([]);
    setSelectedTopic(null);
    if (onProceed) {
      onProceed();
      return;
    }
    nextStep();
  };

  return (
    <div className="max-w-[1024px] mx-auto px-8 py-7 space-y-6 lg:h-full lg:flex lg:flex-col lg:space-y-0 lg:gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="saas-title text-[30px] leading-[1.14]">
            热点抓取
          </h2>
          <p className="saas-muted text-[14px] tracking-[-0.224px] mt-1">
            点击卡片选中热点，选中的热点将用于生成选题
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHotspots}
            disabled={hotspotsLoading}
            className="h-9 gap-1.5 border-slate-200 text-[14px]"
          >
            <RefreshCw className={cn("h-4 w-4", hotspotsLoading && "animate-spin")} />
            刷新
          </Button>
          {hotspots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={allSelected ? clearSelectedHotspots : selectAllHotspots}
              className="h-9 gap-1.5 border-slate-200 text-[14px]"
            >
              <CheckCheck className="h-4 w-4" />
              {allSelected ? "取消全选" : "全选"}
            </Button>
          )}
        </div>
      </div>

      {/* Platform badges + count */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(platformLabels).map(([key, val]) => (
          <Badge
            key={key}
            variant="outline"
            className={cn("text-[12px] font-medium tracking-[-0.12px]", "border border-slate-200", val.bg)}
            style={{ color: val.color }}
          >
            {val.label}
          </Badge>
        ))}
        <Separator orientation="vertical" className="h-4 mx-1" />
        <span className="text-[13px] text-[rgba(0,0,0,0.32)] tracking-[-0.224px]">
          共 {hotspots.length} 条
        </span>
        {selectedHotspots.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Badge className="text-[12px] font-medium tracking-[-0.12px] bg-blue-50 text-blue-600 border-0">
              已选 {selectedHotspots.length} 条
            </Badge>
          </>
        )}
        {hotspots.length > 8 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((prev) => !prev)}
            className="h-7 px-2 text-[12px] text-[rgba(0,0,0,0.52)]"
          >
            {showAll ? "收起" : `展开全部（${hotspots.length}）`}
          </Button>
        )}
      </div>

      {error && (
        <StepStatusAlert
          variant="error"
          title="热点抓取失败"
          description={error}
          actionLabel="重试抓取"
          onAction={fetchHotspots}
        />
      )}

      {/* Loading skeleton */}
      {hotspotsLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[88px] rounded-2xl bg-white/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* Hotspot list */}
      {!hotspotsLoading && hotspots.length > 0 && (
        <div className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {visibleHotspots.map((hotspot, index) => {
            const platform = platformLabels[hotspot.platform];
            const trend = trendConfig[hotspot.trend];
            const TrendIcon = trend.icon;
            const absoluteIndex = hotspots.findIndex((item) => item.id === hotspot.id);
            const isTop3 = absoluteIndex > -1 && absoluteIndex < 3;
            const isSelected = selectedHotspots.some((h) => h.id === hotspot.id);

            return (
              <div
                key={hotspot.id}
                onClick={() => toggleHotspot(hotspot)}
                className={cn(
                  "saas-card p-5 cursor-pointer transition-all duration-200",
                  "border-l-4",
                  isSelected
                    ? "ring-2 ring-blue-500/30 border-l-blue-500"
                    : "ring-1 ring-slate-200 hover:ring-blue-300/40",
                  isTop3 && !isSelected ? "border-l-slate-300" : ""
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Selection toggle */}
                  <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="h-6 w-6 text-[#0071e3]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[rgba(0,0,0,0.24)]" />
                    )}
                  </div>

                  {/* Rank */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5",
                      "text-[13px] font-semibold tracking-[-0.224px]",
                      isTop3
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {(absoluteIndex > -1 ? absoluteIndex : index) + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium tracking-[-0.12px] border-0"
                        style={{ background: platform.bg, color: platform.color }}
                      >
                        {platform.label}
                      </Badge>
                      {isTop3 && (
                        <Badge className="text-[11px] font-medium tracking-[-0.12px] border border-slate-200 bg-slate-50 text-slate-600">
                          <Flame className="h-2.5 w-2.5 mr-0.5" />
                          TOP
                        </Badge>
                      )}
                      <span
                        className="flex items-center gap-0.5 text-[12px] font-medium"
                        style={{ color: trend.color }}
                      >
                        <TrendIcon className="h-3 w-3" />
                        {trend.label}
                      </span>
                      {/* Score bar */}
                      <div className="ml-auto flex items-center gap-2">
                        <Progress value={hotspot.score} className="w-[80px] h-[3px]" />
                        <span className="text-[12px] font-mono text-slate-400 w-5 text-right">
                          {hotspot.score}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-[16px] font-semibold tracking-[-0.3px] leading-[1.35] text-slate-900">
                      {hotspot.title}
                    </p>

                    {/* Keywords */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {hotspot.keywords.slice(0, 4).map((kw) => (
                        <Badge
                          key={kw}
                          variant="outline"
                          className="text-[11px] tracking-[-0.12px] bg-slate-100 text-slate-500 border-0"
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hotspotsLoading && hotspots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <TrendingUpIcon className="h-8 w-8 text-[rgba(0,0,0,0.12)]" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              暂无热点数据
            </p>
            <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
              点击刷新按钮重新抓取
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      {selectedHotspots.length > 0 && (
        <div className="flex justify-end pt-2 lg:pt-0">
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-1.5 h-10 px-5"
            onClick={handleNext}
          >
            生成选题（{selectedHotspots.length} 条）
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
