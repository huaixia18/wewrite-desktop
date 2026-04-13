"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Shield,
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

/* ─── Apple Step: Humanizer ────────────────────────────────────────────
 * Clean scan report with layer tabs
 * Apple stats cards, white cards per rule
 */
const HUMANIZER_RULES = [
  { id: 1, name: "重要性夸大", layer: "content" },
  { id: 2, name: "名气堆砌", layer: "content" },
  { id: 3, name: "-ing表面分析", layer: "content" },
  { id: 4, name: "广告味语言", layer: "content" },
  { id: 5, name: "模糊引用", layer: "content" },
  { id: 6, name: "公式化挑战段", layer: "content" },
  { id: 7, name: "AI高频词汇", layer: "language" },
  { id: 8, name: "系动词回避", layer: "language" },
  { id: 9, name: "否定并列", layer: "language" },
  { id: 10, name: "规则三", layer: "language" },
  { id: 11, name: "同义替换循环", layer: "language" },
  { id: 12, name: "虚假范围", layer: "language" },
  { id: 13, name: "被动语态/无主句", layer: "language" },
  { id: 14, name: "破折号过密", layer: "style" },
  { id: 15, name: "加粗过度", layer: "style" },
  { id: 16, name: "标题列表化", layer: "style" },
  { id: 17, name: "标题Title Case", layer: "style" },
  { id: 18, name: "Emoji过多", layer: "style" },
  { id: 19, name: "弯引号", layer: "style" },
  { id: 20, name: "Chatbot语气", layer: "communication" },
  { id: 21, name: "知识截止声明", layer: "communication" },
  { id: 22, name: "谄媚语气", layer: "communication" },
  { id: 23, name: "填充短语", layer: "filler" },
  { id: 24, name: "过度委婉", layer: "filler" },
  { id: 25, name: "通用正面结尾", layer: "filler" },
  { id: 26, name: "连字符过度使用", layer: "filler" },
  { id: 27, name: "权威修辞", layer: "filler" },
  { id: 28, name: "宣言式引导", layer: "filler" },
  { id: 29, name: "碎片化标题", layer: "filler" },
];

const layerConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  content:      { color: "#ea0d11", bg: "bg-[#ea0d11]/8", border: "border-l-[#ea0d11]", label: "内容" },
  language:     { color: "#f59e0b", bg: "bg-[#f59e0b]/8", border: "border-l-[#f59e0b]", label: "语言" },
  style:        { color: "#7c3aed", bg: "bg-[#7c3aed]/8", border: "border-l-[#7c3aed]", label: "风格" },
  communication:{ color: "#0071e3", bg: "bg-[#0071e3]/8", border: "border-l-[#0071e3]", label: "表达" },
  filler:       { color: "#16a34a", bg: "bg-[#16a34a]/8", border: "border-l-[#16a34a]", label: "填充" },
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

  const stats = report
    ? {
        total: report.hits.reduce((sum, h) => sum + h.count, 0),
        content: report.hits.filter((h) => HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "content").length,
        language: report.hits.filter((h) => HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "language").length,
        style: report.hits.filter((h) => HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === "style").length,
      }
    : null;

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]">
            去 AI 化
          </h2>
          <p className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
            基于 29 种 AI 写作痕迹规则，扫描并修复文章中的 AI 味
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[rgba(0,0,0,0.48)]">自动修复</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-1.5 h-9"
            onClick={runHumanizer}
            disabled={analyzing || !article.content}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {analyzing ? "扫描中..." : "开始扫描"}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "命中总数", value: stats.total, color: "#ea0d11", bg: "bg-[#ea0d11]/6" },
            { label: "内容模式", value: stats.content, color: "#ea0d11", bg: "bg-[#ea0d11]/4" },
            { label: "语言模式", value: stats.language, color: "#f59e0b", bg: "bg-[#f59e0b]/4" },
            { label: "风格模式", value: stats.style, color: "#7c3aed", bg: "bg-[#7c3aed]/4" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn("rounded-2xl p-4 text-center", stat.bg)}
            >
              <div
                className="text-[28px] font-semibold tracking-[-0.28px] leading-[1.1]"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[12px] text-[rgba(0,0,0,0.48)] mt-1 tracking-[-0.12px]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed alert */}
      {fixed && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#34c759]/8 border border-[#34c759]/20">
          <CheckCircle2 className="h-5 w-5 text-[#34c759] shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-[#1d1d1f]">自动修复完成</p>
            <p className="text-[13px] text-[rgba(0,0,0,0.48)] mt-0.5">
              {report?.hits.length ?? 0} 项规则已处理，文章已更新
            </p>
          </div>
        </div>
      )}

      {/* Report tabs */}
      {report && report.hits.length > 0 && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList variant="default" className="bg-transparent p-0 gap-1">
            {[
              { value: "all", label: "全部", count: report.hits.length },
              ...(["content", "language", "style", "communication", "filler"] as const).map((l) => ({
                value: l,
                label: layerConfig[l].label,
                count: report.hits.filter((h) => HUMANIZER_RULES.find((r) => r.id === h.ruleId)?.layer === l).length,
              })),
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-selected:bg-[#1d1d1f] data-selected:text-white data-selected:shadow-none rounded-full"
                style={{
                  background: "transparent",
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1d1d1f",
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1.5 text-[10px] font-mono border-0"
                    style={{ background: `${layerConfig[tab.value]?.color ?? "#0071e3"}20`, color: layerConfig[tab.value]?.color ?? "#0071e3" }}
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["all", "content", "language", "style", "communication", "filler"] as const).map((tab) => {
            const filtered =
              tab === "all"
                ? report.hits
                : report.hits.filter((h) => {
                    const rule = HUMANIZER_RULES.find((r) => r.id === h.ruleId);
                    return rule?.layer === tab;
                  });

            if (filtered.length === 0) return null;
            const lc = layerConfig[tab === "all" ? "content" : tab];

            return (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-0">
                {filtered.map((hit) => {
                  const rule = HUMANIZER_RULES.find((r) => r.id === hit.ruleId);
                  if (!rule) return null;
                  const layerInfo = layerConfig[rule.layer];

                  return (
                    <div
                      key={hit.ruleId}
                      className={cn(
                        "bg-white rounded-2xl p-5 border-l-4",
                        lc.border,
                        "border border-black/[0.06]"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <AlertTriangle
                          className="h-5 w-5 shrink-0 mt-0.5"
                          style={{ color: layerInfo.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                              {rule.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium tracking-[-0.12px] border-0"
                              style={{ background: layerInfo.bg, color: layerInfo.color }}
                            >
                              {layerInfo.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0"
                            >
                              命中 {hit.count} 处
                            </Badge>
                          </div>
                          {/* Samples */}
                          <div className="mt-2 space-y-1">
                            {hit.samples.slice(0, 2).map((sample, i) => (
                              <div
                                key={i}
                                className="text-[13px] text-[rgba(0,0,0,0.48)] bg-[#f5f5f7] rounded-xl px-3 py-2 font-mono leading-[1.4]"
                              >
                                {sample.length > 120
                                  ? sample.slice(0, 120) + "..."
                                  : sample}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Empty state */}
      {!report && !analyzing && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <Shield className="h-8 w-8 text-[rgba(0,0,0,0.12)]" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              Humanizer 待运行
            </p>
            <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1 max-w-sm">
              点击「开始扫描」，系统将分析文章中的 29 种 AI 写作痕迹
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runHumanizer}
          className="h-9 gap-1.5 text-[14px] border-[rgba(0,0,0,0.08)]"
        >
          <RotateCcw className="h-4 w-4" />
          重新扫描
        </Button>
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="gap-1.5 h-10 px-5"
          onClick={nextStep}
        >
          SEO + 配图
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
