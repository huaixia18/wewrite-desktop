"use client";

import { useEffect } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  ChevronRight,
  Flame,
  TrendingUpIcon,
} from "lucide-react";

/* ─── Apple Step: Hotspot ────────────────────────────────────────────────
 * Light gray body (#f5f5f7) with white cards
 * Apple typography, clean metrics, blue CTAs
 */
const platformLabels: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  weibo: {
    label: "微博",
    color: "#ff8200",
    bg: "bg-[#ff8200]/10",
  },
  toutiao: {
    label: "头条",
    color: "#ea0d11",
    bg: "bg-[#ea0d11]/10",
  },
  baidu: {
    label: "百度",
    color: "#2932e1",
    bg: "bg-[#2932e1]/10",
  },
};

const trendConfig = {
  rising: { icon: TrendingUp, label: "上升", color: "#ff3b30" },
  stable: { icon: Minus, label: "持平", color: "#8e8e93" },
  fading: { icon: TrendingDown, label: "下降", color: "#0071e3" },
};

export function HotspotStep() {
  const {
    hotspots,
    hotspotsLoading,
    setHotspots,
    setHotspotsLoading,
    setProgressText,
    currentStep,
    nextStep,
  } = usePipelineStore();

  const fetchHotspots = async () => {
    if (currentStep !== 1) return;
    setHotspotsLoading(true);
    setProgressText("正在抓取热点...");
    try {
      const res = await fetch("/api/topics/hotspots");
      const data = await res.json();
      setHotspots(data.hotspots ?? []);
      setProgressText(`已抓取 ${data.hotspots?.length ?? 0} 条热点`);
    } catch {
      setHotspots([]);
      setProgressText("热点抓取失败，请检查网络");
    } finally {
      setHotspotsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1 && hotspots.length === 0 && !hotspotsLoading) {
      fetchHotspots();
    }
  }, [currentStep]);

  const handleNext = () => nextStep();

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]"
          >
            热点抓取
          </h2>
          <p
            className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1"
          >
            实时聚合微博热搜、头条热榜、百度指数，筛选高潜力话题
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHotspots}
          disabled={hotspotsLoading}
          className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px] shrink-0"
        >
          <RefreshCw
            className={cn("h-4 w-4", hotspotsLoading && "animate-spin")}
          />
          刷新
        </Button>
      </div>

      {/* Platform badges */}
      <div className="flex items-center gap-2">
        {Object.entries(platformLabels).map(([key, val]) => (
          <Badge
            key={key}
            variant="outline"
            className={cn(
              "text-[12px] font-medium tracking-[-0.12px]",
              "border-0",
              val.bg
            )}
            style={{ color: val.color }}
          >
            {val.label}
          </Badge>
        ))}
        <Separator orientation="vertical" className="h-4 mx-1" />
        <span className="text-[13px] text-[rgba(0,0,0,0.32)] tracking-[-0.224px]">
          共 {hotspots.length} 条
        </span>
      </div>

      {/* Loading skeleton */}
      {hotspotsLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-[88px] rounded-2xl bg-white/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Hotspot list */}
      {!hotspotsLoading && hotspots.length > 0 && (
        <div className="space-y-2">
          {hotspots.map((hotspot, index) => {
            const platform = platformLabels[hotspot.platform];
            const trend = trendConfig[hotspot.trend];
            const TrendIcon = trend.icon;
            const isTop3 = index < 3;

            return (
              <div
                key={hotspot.id}
                className={cn(
                  "bg-white rounded-2xl p-5",
                  "border-l-4 transition-all duration-200",
                  "hover:shadow-[rgba(0,0,0,0.08)_0_2px_12px_0px]",
                  isTop3 ? "border-l-[#ff9500]" : "border-l-transparent"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5",
                      "text-[13px] font-semibold tracking-[-0.224px]",
                      isTop3
                        ? "bg-[#ff9500] text-white"
                        : "bg-[#f5f5f7] text-[rgba(0,0,0,0.32)]"
                    )}
                  >
                    {index + 1}
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
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium tracking-[-0.12px] border-0 bg-[#ff3b30]/10 text-[#ff3b30]"
                        >
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
                        <Progress
                          value={hotspot.score}
                          className="w-[80px] h-[3px]"
                        />
                        <span className="text-[12px] font-mono text-[rgba(0,0,0,0.32)] w-5 text-right">
                          {hotspot.score}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <p
                      className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.3] text-[#1d1d1f]"
                    >
                      {hotspot.title}
                    </p>

                    {/* Keywords */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {hotspot.keywords.slice(0, 4).map((kw) => (
                        <Badge
                          key={kw}
                          variant="outline"
                          className="text-[11px] tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0"
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
      {hotspots.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-1.5 h-10 px-5"
            onClick={handleNext}
          >
            去选题
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
