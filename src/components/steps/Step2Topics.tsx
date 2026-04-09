import { useState, useEffect, useCallback } from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { api } from "../../lib/tauri";

interface Topic {
  title: string;
  score: number;
  framework: string;
  keywords: string[];
  recommended: boolean;
  is_hot?: boolean;
}

interface Step2TopicsProps {
  onNext: () => void;
  onBack: () => void;
  onTopicSelected?: (topic: Topic) => void;
}

export function Step2Topics({ onNext, onBack, onTopicSelected }: Step2TopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = { current: false };

  const fetchTopics = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const result = await api.runPipelineStep(2);
      if (cancelledRef.current) return;
      const arr = (result.data as { topics: Topic[] }).topics;
      if (!arr || arr.length === 0) throw new Error("AI 未返回选题");
      setTopics(arr);
      setSelected(0);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(typeof e === "string" ? e : "加载选题失败");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  const cancelFetch = () => {
    cancelledRef.current = true;
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    fetchTopics();
    return () => { cancelledRef.current = true; };
  }, [fetchTopics]);

  const handleSelect = () => {
    if (topics[selected]) {
      onTopicSelected?.(topics[selected]);
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">选题</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {loading ? "AI 正在根据你的行业和受众生成选题…" : `基于你的行业，生成了 ${topics.length} 个候选选题。`}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--color-apple-blue)]" onClick={fetchTopics} disabled={loading}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          重新生成
        </Button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-[12px] text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={28} className="animate-spin text-gray-300" />
          <span className="text-[12px] text-[var(--color-text-tertiary)]">正在生成选题，可能需要 10-30 秒…</span>
          <button onClick={cancelFetch} className="text-[12px] text-[var(--color-text-tertiary)] hover:text-red-500 underline">
            取消
          </button>
        </div>
      ) : topics.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-text-tertiary)]">
          暂无选题，请点击「重新生成」或检查 API Key 配置。
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {topics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] text-left transition-all duration-150 border",
                selected === idx
                  ? "border-[var(--color-apple-blue)] bg-blue-50"
                  : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {topic.recommended && <Badge variant="blue">推荐</Badge>}
                  {topic.is_hot ? (
                    <Badge variant="red">热点</Badge>
                  ) : (
                    <Badge variant="gray">常青</Badge>
                  )}
                  <Badge variant="gray">{topic.framework}</Badge>
                </div>
                <p className="text-[13px] font-medium text-[var(--color-near-black)] leading-snug">{topic.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
                    <TrendingUp size={11} />
                    <span>综合评分 {topic.score}</span>
                  </div>
                  {topic.keywords && (
                    <div className="flex gap-1">
                      {topic.keywords.map((kw) => (
                        <span key={kw} className="text-[10px] text-[var(--color-text-tertiary)] bg-gray-100 px-1.5 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack} disabled={loading}>上一步</Button>
        <Button size="md" variant="primary" onClick={handleSelect} disabled={loading || topics.length === 0}>
          选这个选题
        </Button>
      </div>
    </div>
  );
}
