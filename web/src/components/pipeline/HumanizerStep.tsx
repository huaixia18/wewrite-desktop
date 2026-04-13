"use client";

import { useState, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Shield,
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Eye,
  RotateCcw,
} from "lucide-react";

// Humanizer 29 规则定义（来自 skill）
const HUMANIZER_RULES = [
  // Content (1-6)
  { id: 1, name: "重要性夸大", layer: "content" },
  { id: 2, name: "名气堆砌", layer: "content" },
  { id: 3, name: "-ing表面分析", layer: "content" },
  { id: 4, name: "广告味语言", layer: "content" },
  { id: 5, name: "模糊引用", layer: "content" },
  { id: 6, name: "公式化挑战段", layer: "content" },
  // Language (7-13)
  { id: 7, name: "AI高频词汇", layer: "language" },
  { id: 8, name: "系动词回避", layer: "language" },
  { id: 9, name: "否定并列", layer: "language" },
  { id: 10, name: "规则三", layer: "language" },
  { id: 11, name: "同义替换循环", layer: "language" },
  { id: 12, name: "虚假范围", layer: "language" },
  { id: 13, name: "被动语态/无主句", layer: "language" },
  // Style (14-19)
  { id: 14, name: "破折号过密", layer: "style" },
  { id: 15, name: "加粗过度", layer: "style" },
  { id: 16, name: "标题列表化", layer: "style" },
  { id: 17, name: "标题Title Case", layer: "style" },
  { id: 18, name: "Emoji过多", layer: "style" },
  { id: 19, name: "弯引号", layer: "style" },
  // Communication (20-22)
  { id: 20, name: "Chatbot语气", layer: "communication" },
  { id: 21, name: "知识截止声明", layer: "communication" },
  { id: 22, name: "谄媚语气", layer: "communication" },
  // Filler (23-29)
  { id: 23, name: "填充短语", layer: "filler" },
  { id: 24, name: "过度委婉", layer: "filler" },
  { id: 25, name: "通用正面结尾", layer: "filler" },
  { id: 26, name: "连字符过度使用", layer: "filler" },
  { id: 27, name: "权威修辞", layer: "filler" },
  { id: 28, name: "宣言式引导", layer: "filler" },
  { id: 29, name: "碎片化标题", layer: "filler" },
];

const layerColors: Record<string, string> = {
  content: "bg-red-100 text-red-700 border-red-200",
  language: "bg-yellow-100 text-yellow-700 border-yellow-200",
  style: "bg-purple-100 text-purple-700 border-purple-200",
  communication: "bg-blue-100 text-blue-700 border-blue-200",
  filler: "bg-green-100 text-green-700 border-green-200",
};

const layerLabels: Record<string, string> = {
  content: "内容",
  language: "语言",
  style: "风格",
  communication: "表达",
  filler: "填充",
};

export function HumanizerStep() {
  const { article, setArticle, nextStep } = usePipelineStore();
  const [autoMode, setAutoMode] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [report, setReport] = useState<{
    hits: Array<{ ruleId: number; count: number; samples: string[] }>;
    score: number;
    layers: Record<string, number>;
  } | null>(null);

  const runHumanizer = async () => {
    if (!article.content) return;
    setAnalyzing(true);
    setReport(null);
    setFixed(false);

    try {
      const res = await fetch("/api/ai/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.content }),
      });
      const data = await res.json();

      setReport(data.report);
      setArticle({ humanizerReport: data.report });

      if (autoMode && data.fixed) {
        setArticle({ content: data.fixed });
        setFixed(true);
      }
    } catch {
      // ignore
    } finally {
      setAnalyzing(false);
    }
  };

  const acceptFix = (ruleId: number) => {
    if (!report) return;
    // 交互模式：手动接受/拒绝每条修复
  };

  const stats = report
    ? {
        total: report.hits.reduce((sum, h) => sum + h.count, 0),
        content: report.hits.filter((h) =>
          HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "content"
        ).length,
        language: report.hits.filter((h) =>
          HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "language"
        ).length,
        style: report.hits.filter((h) =>
          HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "style"
        ).length,
      }
    : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">去 AI 化 — Humanizer</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            基于 Wikipedia 29 种 AI 写作痕迹规则，扫描并修复文章中的 AI 味
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 自动/手动切换 */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-mode"
              checked={autoMode}
              onCheckedChange={setAutoMode}
            />
            <Label htmlFor="auto-mode" className="text-[12px]">
              自动修复
            </Label>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-blue-500 hover:bg-blue-600"
            onClick={runHumanizer}
            disabled={analyzing || !article.content}
          >
            {analyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            {analyzing ? "扫描中..." : "开始扫描"}
          </Button>
        </div>
      </div>

      {/* 综合评分 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">命中总数</div>
            </CardContent>
          </Card>
          <Card className="border-red-100">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.content}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">内容模式</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.language}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">语言模式</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.style}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">风格模式</div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-3 text-center">
              <Progress value={report?.score ?? 0} className="h-2 mb-1" />
              <div className="text-[13px] font-bold">{report?.score ?? 0}分</div>
              <div className="text-[11px] text-muted-foreground">人类感评分</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 修复状态 */}
      {fixed && (
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-[13px] text-green-700">
              自动修复完成，{report?.hits.length ?? 0} 项规则已处理
            </span>
            <Badge variant="outline" className="ml-auto text-[10px] bg-green-100">
              已更新文章
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* 规则检测报告 */}
      {report && report.hits.length > 0 && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-fit">
            <TabsTrigger value="all" className="text-[11px] gap-1">
              全部 <Badge variant="secondary" className="ml-1 text-[9px]">{report.hits.length}</Badge>
            </TabsTrigger>
            {(["content", "language", "style", "communication", "filler"] as const).map((l) => (
              <TabsTrigger key={l} value={l} className="text-[11px] gap-1">
                {layerLabels[l]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["all", "content", "language", "style", "communication", "filler"] as const).map(
            (tab) => {
              const filtered = tab === "all"
                ? report.hits
                : report.hits.filter((h) => {
                    const rule = HUMANIZER_RULES.find((r) => r.id === h.ruleId);
                    return rule?.layer === tab;
                  });

              if (filtered.length === 0) return null;

              return (
                <TabsContent key={tab} value={tab} className="space-y-2">
                  {filtered.map((hit) => {
                    const rule = HUMANIZER_RULES.find((r) => r.id === hit.ruleId);
                    if (!rule) return null;

                    return (
                      <Card key={hit.ruleId} className="border-l-4 border-l-yellow-400">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold">{rule.name}</span>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px]", layerColors[rule.layer])}
                                >
                                  {layerLabels[rule.layer]}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  命中 {hit.count} 处
                                </Badge>
                              </div>
                              {/* 样本 */}
                              <div className="mt-2 space-y-1">
                                {hit.samples.slice(0, 2).map((sample, i) => (
                                  <div
                                    key={i}
                                    className="text-[12px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5 font-mono"
                                  >
                                    {sample.length > 120
                                      ? sample.slice(0, 120) + "..."
                                      : sample}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {!autoMode && (
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px]"
                                  onClick={() => acceptFix(hit.ruleId)}
                                >
                                  接受
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px]"
                                >
                                  忽略
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              );
            }
          )}
        </Tabs>
      )}

      {/* 空状态 */}
      {!report && !analyzing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Shield className="h-10 w-10 text-muted-foreground/20" />
            <div className="text-center">
              <p className="text-[14px] font-medium">Humanizer 待运行</p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
                点击「开始扫描」，系统将分析文章中的 29 种 AI 写作痕迹，并根据设置自动或手动修复
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 下一步 */}
      <div className="flex justify-end pt-2 gap-2">
        <Button variant="outline" size="sm" onClick={runHumanizer} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          重新扫描
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          onClick={nextStep}
        >
          SEO + 配图
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
