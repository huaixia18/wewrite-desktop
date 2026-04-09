import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { api } from "../../lib/tauri";
import { usePipelineStore } from "../../store/pipeline";

interface Step4WritingProps {
  onNext: () => void;
  onBack: () => void;
  topic?: { title: string; framework: string };
  framework?: string;
  onArticleReady?: (content: string) => void;
}

export function Step4Writing({ onNext, onBack, topic, framework, onArticleReady }: Step4WritingProps) {
  const { articleContent, setArticleContent, collectedMaterials } = usePipelineStore();
  const [phase, setPhase] = useState<"loading" | "streaming" | "done" | "error">(
    articleContent ? "done" : "loading"
  );
  const [article, setArticle] = useState(articleContent || "");
  const [displayedChars, setDisplayedChars] = useState(articleContent ? articleContent.length : 0);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const hasFetched = useRef(false);
  const cancelledRef = useRef(false);

  const fetchArticle = useCallback(async () => {
    if (articleContent) return;
    cancelledRef.current = false;
    hasFetched.current = true;
    setPhase("loading");
    setArticle("");
    setDisplayedChars(0);
    setError(null);
    try {
      const result = await api.runPipelineStep(4, {
        title: topic?.title || "（未选择选题，请先在第二步选择）",
        framework: framework || topic?.framework || "热点解读",
        materials: collectedMaterials.length > 0 ? collectedMaterials : undefined,
      });
      if (cancelledRef.current) return;
      const data = result.data as { article: string; word_count: number; h2_count?: number };
      const text = data.article || "AI 未返回内容";
      setArticle(text);
      setWordCount(data.word_count || 0);
      setArticleContent(text);
      setPhase("streaming");
      onArticleReady?.(text);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(typeof e === "string" ? e : "写作失败，请检查 API Key 配置");
      setPhase("error");
    }
  }, [topic, framework, articleContent, setArticleContent, onArticleReady]);

  const cancelFetch = () => {
    cancelledRef.current = true;
    setPhase("error");
    setError("已取消");
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchArticle();
    }
    return () => { cancelledRef.current = true; };
  }, [fetchArticle]);

  // Simulate streaming display
  useEffect(() => {
    if (phase !== "streaming") return;
    if (displayedChars >= article.length) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setDisplayedChars((n) => Math.min(n + 30, article.length)), 16);
    return () => clearTimeout(t);
  }, [phase, displayedChars, article.length]);

  const content = article.slice(0, displayedChars);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">写作</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {phase === "loading" && "AI 正在写作，可能需要 30-60 秒…"}
            {phase === "streaming" && "AI 正在写作…"}
            {phase === "done" && `初稿完成，共 ${wordCount || content.replace(/\s/g, "").length} 字。`}
            {phase === "error" && "写作出错了"}
          </p>
        </div>
        {phase === "streaming" && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-apple-blue)]">
            <Loader2 size={13} className="animate-spin" />
            <span>写作中</span>
          </div>
        )}
        {phase === "done" && (
          <div className="flex items-center gap-2 text-[12px] text-green-600">
            <FileText size={13} />
            <span>初稿完成</span>
          </div>
        )}
      </div>

      {topic?.title && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-blue-50 border border-blue-100">
          <span className="text-[11px] text-blue-500">选题：</span>
          <span className="text-[12px] font-medium text-[var(--color-near-black)]">{topic.title}</span>
        </div>
      )}

      {phase === "error" ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-[13px] text-red-500">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => { hasFetched.current = false; fetchArticle(); }}>
            重试
          </Button>
        </div>
      ) : phase === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={28} className="animate-spin text-gray-300" />
          <span className="text-[12px] text-[var(--color-text-tertiary)]">AI 正在构思和写作，通常需要 30-60 秒…</span>
          <button onClick={cancelFetch} className="text-[12px] text-[var(--color-text-tertiary)] hover:text-red-500 underline">
            取消
          </button>
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-sm)] bg-[var(--color-light-bg)] p-4 text-[13px] text-[var(--color-near-black)] leading-relaxed overflow-y-auto whitespace-pre-wrap"
          style={{ maxHeight: "420px", fontFamily: 'inherit' }}
        >
          {content}
          {phase === "streaming" && <span className="inline-block w-2 h-3.5 bg-[var(--color-apple-blue)] ml-0.5 align-middle animate-pulse" />}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack} disabled={phase === "loading" || phase === "streaming"}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext} disabled={phase !== "done"}>
          下一步：去AI化
        </Button>
      </div>
    </div>
  );
}
