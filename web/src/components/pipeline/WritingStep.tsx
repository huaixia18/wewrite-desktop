"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save, ChevronRight, Cloud } from "lucide-react";

/* ─── Apple Step: Writing ──────────────────────────────────────────────
 * Split-pane: editor + live preview
 * Dark title bar, light content area
 */
export function WritingStep() {
  const {
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    materials,
    article,
    setArticle,
    setProgressText,
    nextStep,
    markStepDone,
    setRuntime,
    cloudSyncAt,
    setCloudSyncAt,
    runtime,
  } = usePipelineStore();

  const [generating, setGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState(article.content ?? "");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(Boolean(article.content));
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const saveDraft = useCallback(
    async (silent = false) => {
      const content = (streamedContent || article.content || "").trim();
      if (!content) return;

      try {
        setSaveState("saving");
        const data = await fetchJson<{
          article: { id: string; updatedAt: string; wordCount: number };
        }>("/api/articles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: article.id,
            title: article.title || selectedTopic?.title,
            content,
            topic: selectedTopic,
            framework: selectedFramework,
            enhanceStrategy: selectedStrategy,
            keywords: selectedTopic?.keywords,
            status: "draft",
            wordCount: content.replace(/[#*`>\n]/g, "").length,
          }),
        });

        setArticle({
          id: data.article.id,
          content,
          wordCount: data.article.wordCount,
        });
        setCloudSyncAt(data.article.updatedAt);
        setSaveState("saved");
        setProgressText(silent ? "草稿已自动保存到云端" : "草稿已保存到云端");
        if (!silent) toast.success("草稿已保存到云端");
      } catch (err) {
        const message = err instanceof Error ? err.message : "草稿保存失败";
        setSaveState("error");
        setError(message);
        if (!silent) toast.error(message);
      }
    },
    [
      streamedContent,
      article.content,
      article.id,
      article.title,
      selectedTopic,
      selectedFramework,
      selectedStrategy,
      setArticle,
      setCloudSyncAt,
      setProgressText,
    ]
  );

  const startWriting = useCallback(async () => {
    if (generating) return;
    setError("");
    setGenerating(true);
    setStreamedContent("");
    setProgress(0);
    setDone(false);
    setProgressText("正在写作...");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          framework: selectedFramework,
          strategy: selectedStrategy,
          materials,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("写作请求失败");

      const aiModeHeader = res.headers.get("X-AI-Mode");
      const aiProviderHeader = res.headers.get("X-AI-Provider");
      if (aiModeHeader === "mock" || aiModeHeader === "live") {
        setRuntime({
          aiMode: aiModeHeader,
          aiProvider: aiProviderHeader || "未检测",
        });
        if (aiModeHeader === "mock") {
          toast.warning("当前为 Mock 写作模式，AI 服务暂未就绪。");
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") {
            setProgress(100);
            continue;
          }

          try {
            const parsed = JSON.parse(data) as {
              type?: "content" | "title" | "done" | "error";
              text?: string;
            };
            if (parsed.type === "content" && parsed.text) {
              assembled += parsed.text;
              setStreamedContent(assembled);
              setArticle({
                content: assembled,
                wordCount: assembled.replace(/[#*`>\n]/g, "").length,
              });
              setProgress((p) => Math.min(p + 2, 95));
            } else if (parsed.type === "title" && parsed.text) {
              setArticle({ title: parsed.text });
            } else if (parsed.type === "error") {
              throw new Error(parsed.text || "写作服务异常");
            } else if (parsed.type === "done") {
              setDone(true);
              setProgress(100);
            }
          } catch (err) {
            if (err instanceof Error) {
              throw err;
            }
          }
        }
      }

      if (assembled.trim()) {
        setDone(true);
        setProgress(100);
        setProgressText("写作完成");
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        const message = err instanceof Error ? err.message : "写作出错，请重试";
        setError(message);
        setProgressText("写作出错，请重试");
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  }, [
    generating,
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    materials,
    setArticle,
    setProgressText,
    setRuntime,
  ]);

  useEffect(() => {
    if (done || streamedContent.trim()) {
      markStepDone();
    }
  }, [done, streamedContent, markStepDone]);

  useEffect(() => {
    if (!article.content && !generating && !done && !streamedContent) {
      void startWriting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (generating) return;
    if (!streamedContent.trim()) return;

    const timer = window.setTimeout(() => {
      void saveDraft(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [streamedContent, article.title, generating, saveDraft]);

  const handleStop = () => {
    abortRef.current?.abort();
    setGenerating(false);
    if (streamedContent) {
      setArticle({
        content: streamedContent,
        wordCount: streamedContent.replace(/[#*`>\n]/g, "").length,
      });
    }
    setProgressText("已暂停写作");
  };

  return (
    <div className="flex h-full">
      {/* ── Left: Editor ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-black/[0.06]">
        {/* Title bar */}
        <div className="border-b border-black/[0.06] bg-[#fafafa] px-5 pb-3 pt-5">
          <input
            className="w-full bg-transparent text-[21px] font-semibold tracking-[-0.374px] outline-none placeholder:text-[rgba(0,0,0,0.2)]"
            placeholder="输入文章标题..."
            value={article.title || selectedTopic?.title || ""}
            onChange={(e) => setArticle({ title: e.target.value })}
          />
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-0 bg-[#f5f5f7] text-[11px] font-medium tracking-[-0.12px] text-[rgba(0,0,0,0.48)]"
            >
              {selectedFramework}
            </Badge>
            <Badge
              variant="outline"
              className="border-0 bg-[#f5f5f7] text-[11px] font-medium tracking-[-0.12px] text-[rgba(0,0,0,0.48)]"
            >
              {selectedStrategy}
            </Badge>
            <Badge
              variant="outline"
              className="border-0 bg-[#f5f5f7] text-[11px] font-medium tracking-[-0.12px]"
            >
              {runtime.aiMode === "live"
                ? `真实 AI · ${runtime.aiProvider}`
                : runtime.aiMode === "mock"
                ? "Mock AI 模式"
                : "AI 模式待检测"}
            </Badge>
            {streamedContent && (
              <span className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.32)]">
                {streamedContent.replace(/[#*`>\n]/g, "").length.toLocaleString()} 字
              </span>
            )}
            <div className="ml-auto flex items-center gap-1 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.42)]">
              <Cloud className="h-3.5 w-3.5" />
              {saveState === "saving"
                ? "云端保存中..."
                : cloudSyncAt
                ? `云端已保存 ${new Date(cloudSyncAt).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "未同步到云端"}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-5 pt-4">
            <StepStatusAlert
              variant="error"
              title="写作步骤出错"
              description={error}
              actionLabel="重试生成"
              onAction={() => void startWriting()}
            />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 overflow-auto p-5">
          {generating && !streamedContent ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
              <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                正在构思文章结构...
              </p>
              <Progress value={progress} className="h-[3px] w-48" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="h-full min-h-[400px] w-full resize-none bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "17px",
                lineHeight: "1.47",
                letterSpacing: "-0.374px",
                color: "#1d1d1f",
              }}
              placeholder="写作内容将在这里实时显示..."
              value={streamedContent}
              onChange={(e) => {
                const value = e.target.value;
                setStreamedContent(value);
                setArticle({
                  content: value,
                  wordCount: value.replace(/[#*`>\n]/g, "").length,
                });
              }}
            />
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center gap-2 border-t border-black/[0.06] bg-[#fafafa] px-5 py-3">
          {generating ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px]"
            >
              停止
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void startWriting()}
              className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px]"
            >
              <RotateCcw className="h-4 w-4" />
              重新生成
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-[rgba(0,0,0,0.08)] text-[14px]"
            onClick={() => void saveDraft(false)}
            disabled={!streamedContent || saveState === "saving"}
          >
            <Save className="h-4 w-4" />
            保存草稿
          </Button>

          <div className="flex-1" />

          {streamedContent && (
            <Button
              size="pill-sm"
              variant="pill-filled"
              className="h-10 gap-1.5 px-5"
              onClick={nextStep}
            >
              去 AI 化
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="w-[440px] shrink-0 overflow-auto bg-[#f5f5f7]">
        <div className="border-b border-black/[0.06] bg-white px-5 py-3">
          <span className="text-[12px] font-medium tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
            实时预览
          </span>
        </div>
        <div className="p-5">
          <Card className="rounded-2xl bg-white">
            <div className="p-6">
              {streamedContent ? (
                <div
                  className="text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]"
                  dangerouslySetInnerHTML={{
                    __html: streamedContent
                      .replace(
                        /^### (.+)$/gm,
                        "<h3 style='font-size:21px;font-weight:700;margin:16px 0 8px;'>$1</h3>"
                      )
                      .replace(
                        /^## (.+)$/gm,
                        "<h2 style='font-size:28px;font-weight:600;margin:20px 0 10px;'>$1</h2>"
                      )
                      .replace(
                        /^# (.+)$/gm,
                        "<h1 style='font-size:34px;font-weight:700;margin:24px 0 12px;'>$1</h1>"
                      )
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.+?)\*/g, "<em>$1</em>")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              ) : (
                <p className="text-[14px] text-[rgba(0,0,0,0.16)]">写作内容将在这里实时预览...</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
