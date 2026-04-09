import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface HitRecord {
  rule: string;
  location: string;
  severity: "high" | "medium" | "low";
  original: string;
  fixed: string;
}

const MOCK_HITS: HitRecord[] = [
  { rule: "AI词汇过度使用", location: "第2段第1句", severity: "high", original: "这是一个至关重要的转折点", fixed: "这是一个转折点" },
  { rule: "Em破折号过度使用", location: "第3段第2句", severity: "medium", original: "这个问题——真的很复杂——需要时间", fixed: "这个问题很复杂，需要时间" },
  { rule: "标题宣告语", location: "第4段开头", severity: "medium", original: "让我们深入探讨一下这个问题", fixed: "这个问题有几个值得关注的维度" },
  { rule: "AI词汇过度使用", location: "第5段第3句", severity: "low", original: "这彰显了团队的深度洞察", fixed: "这说明团队想得比较清楚" },
];

interface Step5HumanizerProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step5Humanizer({ onNext, onBack }: Step5HumanizerProps) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  const handleRun = () => {
    setPhase("running");
    setTimeout(() => setPhase("done"), 2000);
  };

  const severityCount = { high: 0, medium: 0, low: 0 };
  MOCK_HITS.forEach((h) => severityCount[h.severity]++);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">去AI化</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">检测并修复 AI 写作痕迹，让文章更像真人。</p>
        </div>
        {phase === "idle" && (
          <Button size="sm" variant="primary" onClick={handleRun}>开始检测</Button>
        )}
        {phase === "running" && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-apple-blue)]">
            <Loader2 size={13} className="animate-spin" />
            <span>检测中</span>
          </div>
        )}
      </div>

      {phase === "idle" && (
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
          <div className="flex flex-col gap-2">
            {MOCK_HITS.map((hit, i) => (
              <div key={i} className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={hit.severity === "high" ? "red" : hit.severity === "medium" ? "yellow" : "gray"}>
                    {hit.severity === "high" ? "高" : hit.severity === "medium" ? "中" : "低"}
                  </Badge>
                  <span className="text-[12px] font-medium text-[var(--color-near-black)]">{hit.rule}</span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">{hit.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-red-50">
                    <p className="text-[10px] text-red-400 mb-1">原文</p>
                    <p className="text-[12px] text-red-700 leading-relaxed">{hit.original}</p>
                  </div>
                  <div className="p-2 rounded bg-green-50">
                    <p className="text-[10px] text-green-400 mb-1">修改后</p>
                    <p className="text-[12px] text-green-700 leading-relaxed">{hit.fixed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext} disabled={phase === "running"}>
          {phase === "done" ? "应用修改" : "跳过"}
        </Button>
      </div>
    </div>
  );
}
