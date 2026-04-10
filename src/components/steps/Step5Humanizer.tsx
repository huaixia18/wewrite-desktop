import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { api } from "../../lib/tauri";
import { usePipelineStore } from "../../store/pipeline";
import { useConfigStore } from "../../store/config";

interface HitRecord {
  rule: string;
  location: string;
  severity: "high" | "medium" | "low";
  original: string;
  fixed: string;
}

interface Step5HumanizerProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step5Humanizer({ onNext, onBack }: Step5HumanizerProps) {
  const { articleContent, setArticleContent, setCompositeScore: setStoreCompositeScore } = usePipelineStore();
  const { config } = useConfigStore();
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [hits, setHits] = useState<HitRecord[]>([]);
  const [fixedContent, setFixedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState<number | null>(null);

  const handleRun = async () => {
    if (!articleContent) {
      setError("没有文章内容，请先完成写作步骤");
      return;
    }
    setPhase("running");
    setError(null);
    try {
      const result = await api.humanize(articleContent, (config.strictness as "relaxed" | "standard" | "strict") || "standard");
      setHits(
        result.hits.map((h) => ({
          rule: h.patternName,
          location: h.locations.map((l) => `第${l.paragraphIndex + 1}段`).join(", "),
          severity: h.severity >= 0.7 ? "high" : h.severity >= 0.4 ? "medium" : "low",
          original: h.locations[0]?.original || "",
          fixed: h.locations[0]?.suggested || "",
        }))
      );
      if (result.fixed !== articleContent) {
        setFixedContent(result.fixed);
      }
      setPhase("done");

      // Run humanness_score.py if skill_path is configured
      if (config.skill_path) {
        try {
          const scoreResult = await api.humannessScore(result.fixed);
          if (scoreResult.success && scoreResult.composite_score !== undefined) {
            const score = scoreResult.composite_score;
            setStoreCompositeScore(score);
            setDisplayScore(score);
          }
        } catch {
          // Silent fail - humanness score is supplementary
        }
      }
    } catch (e) {
      setError(typeof e === "string" ? e : "去AI化检测失败");
      setPhase("idle");
    }
  };

  const handleApply = () => {
    if (fixedContent) {
      setArticleContent(fixedContent);
    }
    onNext();
  };

  const severityCount = { high: 0, medium: 0, low: 0 };
  hits.forEach((h) => severityCount[h.severity]++);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">去AI化</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {phase === "done"
              ? `检测到 ${hits.length} 处 AI 写作痕迹${fixedContent ? "，已自动修复" : ""}`
              : "检测并修复 AI 写作痕迹，让文章更像真人。"}
            {displayScore !== null && (
              <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${
                displayScore < 30 ? "bg-green-50 text-green-600" :
                displayScore < 50 ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-500"
              }`}>
                质量评分: {displayScore}
              </span>
            )}
          </p>
        </div>
        {phase === "idle" && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleRun}
            disabled={!articleContent}
          >
            开始检测
          </Button>
        )}
        {phase === "running" && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-apple-blue)]">
            <Loader2 size={13} className="animate-spin" />
            <span>检测中</span>
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-[12px] text-red-600">
          {error}
        </div>
      )}

      {phase === "idle" && !articleContent && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
          没有文章内容，请先完成写作步骤再进行去AI化。
        </div>
      )}

      {phase === "idle" && articleContent && (
        <div className="flex items-center justify-center py-12 text-[var(--color-text-tertiary)] text-[13px]">
          点击「开始检测」分析文章中的 AI 写作模式
        </div>
      )}

      {phase === "running" && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      )}

      {phase === "done" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-[var(--radius-sm)] bg-red-50 text-center">
              <p className="text-[22px] font-bold text-red-500">{severityCount.high}</p>
              <p className="text-[11px] text-red-400 mt-0.5">高优先级</p>
            </div>
            <div className="p-3 rounded-[var(--radius-sm)] bg-amber-50 text-center">
              <p className="text-[22px] font-bold text-amber-500">{severityCount.medium}</p>
              <p className="text-[11px] text-amber-400 mt-0.5">中优先级</p>
            </div>
            <div className="p-3 rounded-[var(--radius-sm)] bg-green-50 text-center">
              <p className="text-[22px] font-bold text-green-500">{severityCount.low}</p>
              <p className="text-[11px] text-green-400 mt-0.5">低优先级</p>
            </div>
          </div>

          {/* Hit list */}
          {hits.length > 0 && (
            <div className="flex flex-col gap-2">
              {hits.map((hit, i) => (
                <div key={i} className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={hit.severity === "high" ? "red" : hit.severity === "medium" ? "yellow" : "gray"}>
                      {hit.severity === "high" ? "高" : hit.severity === "medium" ? "中" : "低"}
                    </Badge>
                    <span className="text-[12px] font-medium text-[var(--color-near-black)]">{hit.rule}</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{hit.location}</span>
                  </div>
                  {(hit.original || hit.fixed) && (
                    <div className="grid grid-cols-2 gap-2">
                      {hit.original && (
                        <div className="p-2 rounded bg-red-50">
                          <p className="text-[10px] text-red-400 mb-1">原文</p>
                          <p className="text-[12px] text-red-700 leading-relaxed">{hit.original}</p>
                        </div>
                      )}
                      {hit.fixed && (
                        <div className="p-2 rounded bg-green-50">
                          <p className="text-[10px] text-green-400 mb-1">修改后</p>
                          <p className="text-[12px] text-green-700 leading-relaxed">{hit.fixed}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {hits.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[13px] text-green-600">
              未检测到 AI 写作痕迹，文章质量不错！
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button
          size="md"
          variant="primary"
          onClick={phase === "done" && fixedContent ? handleApply : onNext}
          disabled={phase === "running"}
        >
          {phase === "done" && fixedContent ? "应用修改" : "跳过"}
        </Button>
      </div>
    </div>
  );
}
