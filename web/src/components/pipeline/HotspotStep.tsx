"use client";

import { useEffect } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  ChevronRight,
  Flame,
} from "lucide-react";

const platformLabels = {
  weibo: { label: "微博", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  toutiao: { label: "头条", color: "bg-red-500/10 text-red-600 border-red-200" },
  baidu: { label: "百度", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
};

const trendIcons = {
  rising: { icon: TrendingUp, label: "上升", color: "text-red-500" },
  stable: { icon: Minus, label: "持平", color: "text-gray-400" },
  fading: { icon: TrendingDown, label: "下降", color: "text-blue-400" },
};

export function HotspotStep() {
  const {
    hotspots,
    hotspotsLoading,
    setHotspots,
    setHotspotsLoading,
    setProgressText,
    currentStep,
    setCurrentStep,
    nextStep,
    isRunning,
    runMode,
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

  // 自动/交互模式下，当前步骤自动触发
  useEffect(() => {
    if (currentStep === 1 && hotspots.length === 0 && !hotspotsLoading) {
      fetchHotspots();
    }
  }, [currentStep]);

  // 写作完成后跳回第一步
  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">热点抓取</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            实时聚合微博热搜、头条热榜、百度指数，筛选高潜力话题
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHotspots}
          disabled={hotspotsLoading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", hotspotsLoading && "animate-spin")} />
          刷新
        </Button>
      </div>

      {/* 平台标签 */}
      <div className="flex items-center gap-3">
        {Object.entries(platformLabels).map(([key, val]) => (
          <Badge key={key} variant="outline" className={cn("text-[12px]", val.color)}>
            {val.label}
          </Badge>
        ))}
        <Badge variant="outline" className="text-[12px] text-muted-foreground">
          共 {hotspots.length} 条
        </Badge>
      </div>

      {/* 加载状态 */}
      {hotspotsLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      )}

      {/* 热点列表 */}
      {!hotspotsLoading && hotspots.length > 0 && (
        <div className="space-y-3">
          {hotspots.map((hotspot, index) => {
            const platform = platformLabels[hotspot.platform];
            const trend = trendIcons[hotspot.trend];
            const TrendIcon = trend.icon;
            const isTop3 = index < 3;

            return (
              <Card
                key={hotspot.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md cursor-pointer border-l-4",
                  isTop3 ? "border-l-orange-400" : "border-l-transparent"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 排名 */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0 mt-0.5",
                        isTop3 ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px]", platform.color)}>
                          {platform.label}
                        </Badge>
                        {isTop3 && (
                          <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                            <Flame className="h-2.5 w-2.5 mr-0.5 inline" />
                            TOP
                          </Badge>
                        )}
                        <div className={cn("flex items-center gap-0.5 text-[11px]", trend.color)}>
                          <TrendIcon className="h-3 w-3" />
                          <span>{trend.label}</span>
                        </div>
                        {/* 热度分数 */}
                        <div className="ml-auto flex items-center gap-1.5">
                          <Progress value={hotspot.score} className="w-16 h-1.5" />
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {hotspot.score}
                          </span>
                        </div>
                      </div>

                      <p className="text-[14px] font-medium mt-1.5 leading-snug">
                        {hotspot.title}
                      </p>

                      {/* 关键词 */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {hotspot.keywords.slice(0, 4).map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!hotspotsLoading && hotspots.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl opacity-20">🔍</div>
            <div className="text-center">
              <p className="text-[14px] font-medium">暂无热点数据</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                点击刷新按钮重新抓取
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 下一步 */}
      {hotspots.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            className="gap-1.5 bg-blue-500 hover:bg-blue-600"
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
