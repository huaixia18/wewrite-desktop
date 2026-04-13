"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronRight, Star, CheckCircle2, Loader2, Sparkles } from "lucide-react";

const frameworkColors: Record<string, string> = {
  痛点型: "bg-red-50 text-red-600 border-red-200",
  故事型: "bg-purple-50 text-purple-600 border-purple-200",
  清单型: "bg-green-50 text-green-600 border-green-200",
  对比型: "bg-blue-50 text-blue-600 border-blue-200",
  热点解读型: "bg-orange-50 text-orange-600 border-orange-200",
  纯观点型: "bg-gray-50 text-gray-600 border-gray-200",
  复盘型: "bg-teal-50 text-teal-600 border-teal-200",
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

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 选题：基于热点生成选题建议
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

  // 当前步骤且没有选题时自动生成
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">选题分析</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          基于热点生成 10 个备选选题，综合评估点击潜力、SEO 友好度和框架适配
        </p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={generateTopics}
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          重新选题
        </Button>
        <Badge variant="outline" className="text-[12px]">
          {topics.length} 个备选
        </Badge>
        {selectedTopic && (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[12px]">
            已选：{selectedTopic.framework}
          </Badge>
        )}
      </div>

      {/* 选题卡片 */}
      {generating && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      )}

      {!generating && topics.length > 0 && (
        <div className="space-y-3">
          {topics.map((topic, index) => {
            const isSelected = selectedTopic?.id === topic.id;
            const isTopScore = index < 2;

            return (
              <Card
                key={topic.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50/30 border-blue-200"
                    : "border-border"
                )}
                onClick={() => setSelectedTopic(topic)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 选择状态 */}
                    <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      ) : (
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 transition-colors",
                            isTopScore
                              ? "border-orange-400 bg-orange-50"
                              : "border-muted-foreground/30"
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <p className="text-[15px] font-semibold leading-snug">{topic.title}</p>

                      {/* 评分条 */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">点击</span>
                          <Progress value={topic.clickPotential * 20} className="w-14 h-1.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">SEO</span>
                          <Progress value={topic.seoScore * 10} className="w-14 h-1.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">综合</span>
                          <span
                            className={cn(
                              "text-[11px] font-bold font-mono",
                              topic.score >= 80
                                ? "text-red-500"
                                : topic.score >= 60
                                ? "text-orange-500"
                                : "text-muted-foreground"
                            )}
                          >
                            {topic.score}
                          </span>
                        </div>
                      </div>

                      {/* 框架标签 + 关键词 */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", frameworkColors[topic.framework] ?? "")}
                        >
                          {topic.framework}
                        </Badge>
                        {topic.keywords.slice(0, 3).map((kw) => (
                          <Badge key={kw} variant="secondary" className="text-[10px]">
                            {kw}
                          </Badge>
                        ))}
                      </div>

                      {/* 选题理由 */}
                      <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                        {topic.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!generating && topics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl opacity-20">💡</div>
            <div className="text-center">
              <p className="text-[14px] font-medium">暂无选题</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                点击上方刷新按钮重新生成
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 下一步 */}
      {selectedTopic && (
        <div className="flex justify-end pt-2">
          <Button
            className="gap-1.5 bg-blue-500 hover:bg-blue-600"
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
