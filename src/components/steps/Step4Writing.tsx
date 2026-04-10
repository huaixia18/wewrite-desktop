import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, FileText } from "lucide-react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Button } from "../ui/Button";
import { api } from "../../lib/tauri";
import { usePipelineStore } from "../../store/pipeline";

interface WritingPhaseEvent {
  phase: string;
  article: string | null;
  word_count: number | null;
  h2_count: number | null;
  persona: string | null;
  framework: string | null;
  message: string;
}

interface Step4WritingProps {
  onNext: () => void;
  onBack: () => void;
  topic?: { title: string; framework: string };
  framework?: string;
  onArticleReady?: (content: string) => void;
}

export function Step4Writing({ onNext, onBack, topic, framework, onArticleReady }: Step4WritingProps) {
  const { articleContent, setArticleContent, collectedMaterials, setWritingPersona, enhanceStrategy } = usePipelineStore();

  type Phase = "idle" | "loading" | "streaming" | "done" | "error";
  const [phase, setPhase] = useState<Phase>(articleContent ? "done" : "idle");
  const [article, setArticle] = useState(articleContent || "");
  const [displayedChars, setDisplayedChars] = useState(articleContent ? articleContent.length : 0);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [h2Count, setH2Count] = useState(0);
  const [activePersona, setActivePersona] = useState("");
  const [activeFramework, setActiveFramework] = useState("");
  const [phaseMessage, setPhaseMessage] = useState("");
  const hasStarted = useRef(false);
  const cancelledRef = useRef(false);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const startWriting = useCallback(async () => {
    if (articleContent) return;
    if (hasStarted.current) return;
    hasStarted.current = true;
    cancelledRef.current = false;
    setPhase("loading");
    setArticle("");
    setDisplayedChars(0);
    setError(null);
    setPhaseMessage("正在启动写作流程…");

    // Listen to SSE events from Rust backend
    unlistenRef.current = await listen<WritingPhaseEvent>("writing-progress", (event) => {
      if (cancelledRef.current) return;
      const ev = event.payload;
      setPhaseMessage(ev.message);

      if (ev.article) {
        setArticle(ev.article);
        setPhase("streaming");
      }
      if (ev.word_count !== null) setWordCount(ev.word_count);
      if (ev.h2_count !== null) setH2Count(ev.h2_count);
      if (ev.persona) setActivePersona(ev.persona);
      if (ev.framework) setActiveFramework(ev.framework);

      if (ev.phase === "完成") {
        setPhase("done");
        if (ev.article) {
          setArticleContent(ev.article);
          onArticleReady?.(ev.article);
          setWritingPersona(ev.persona || "midnight-friend");
        }
      }
    });

    try {
      const result = await api.writeArticleStreaming({
        title: topic?.title || "（未选择选题，请先在第二步选择）",
        framework: framework || topic?.framework || "热点解读",
        materials: collectedMaterials.length > 0 ? collectedMaterials : undefined,
        enhance_strategy: enhanceStrategy || "angle_discovery",
      });
      if (cancelledRef.current) return;
      // Final result — events may have already updated state, but ensure it's set
      setArticle(result.article);
      setWordCount(result.word_count);
      setH2Count(result.h2_count);
      setActivePersona(result.persona);
      setActiveFramework(result.framework);
      setArticleContent(result.article);
      setWritingPersona(result.persona || "midnight-friend");
      setPhase("done");
      onArticleReady?.(result.article);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(typeof e === "string" ? e : "写作失败，请检查 API Key 配置");
      setPhase("error");
    }
  }, [topic, framework, articleContent, setArticleContent, onArticleReady, setWritingPersona, collectedMaterials, enhanceStrategy]);

  const cancelFetch = () => {
    cancelledRef.current = true;
    unlistenRef.current?.();
    setPhase("error");
    setError("已取消");
  };

  useEffect(() => {
    if (phase === "idle") {
      startWriting();
    }
    return () => {
      cancelledRef.current = true;
      unlistenRef.current?.();
    };
  }, [startWriting, phase]);

  // Simulate streaming display for the article text
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
            {phase === "idle" && "准备启动…"}
            {phase === "loading" && "AI 正在启动，可能需要 30-60 秒…"}
            {phase === "streaming" && phaseMessage}
            {phase === "done" && `完成 | ${activeFramework || framework || "热点解读"} | 人格：${activePersona || "默认"} | ${h2Count}节 | ${wordCount}字`}
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
          <Button size="sm" variant="secondary" onClick={() => { hasStarted.current = false; setPhase("idle"); }}>
            重试
          </Button>
        </div>
      ) : phase === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={28} className="animate-spin text-gray-300" />
          <span className="text-[12px] text-[var(--color-text-tertiary)]">{phaseMessage || "AI 正在构思和写作…"}</span>
          <button onClick={cancelFetch} className="text-[12px] text-[var(--color-text-tertiary)] hover:text-red-500 underline">
            取消
          </button>
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-sm)] bg-[var(--color-light-bg)] p-4 text-[13px] text-[var(--color-near-black)] leading-relaxed overflow-y-auto whitespace-pre-wrap"
          style={{ maxHeight: "420px", fontFamily: "inherit" }}
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
