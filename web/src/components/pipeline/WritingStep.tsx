"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Loader2,
  RotateCcw,
  Save,
  ChevronRight,
} from "lucide-react";

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
  } = usePipelineStore();

  const [generating, setGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startWriting = useCallback(async () => {
    if (generating) return;
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

      if (!res.ok || !res.body) throw new Error("请求失败");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") {
            setProgress(100);
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content") {
              setStreamedContent((prev) => prev + parsed.text);
              setProgress((p) => Math.min(p + 2, 95));
            } else if (parsed.type === "title") {
              setArticle({ title: parsed.text });
            } else if (parsed.type === "done") {
              setDone(true);
              setProgress(100);
            }
          } catch {
            // ignore
          }
        }
      }

      if (streamedContent || streamedContent.length > 0) {
        setArticle({
          content: streamedContent,
          wordCount: streamedContent.replace(/[#*`>\n]/g, "").length,
        });
      }
      setProgressText("写作完成");
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setProgressText("写作出错，请重试");
      }
    } finally {
      setGenerating(false);
    }
  }, [
    generating, selectedTopic, selectedFramework, selectedStrategy, materials,
    setArticle, setProgressText, streamedContent,
  ]);

  useEffect(() => {
    if (!generating && !done && !streamedContent) {
      startWriting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = () => {
    abortRef.current?.abort();
    setGenerating(false);
    if (streamedContent) {
      setArticle({ content: streamedContent });
    }
  };

  const handleSave = async () => {
    await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: article.title || selectedTopic?.title,
        content: article.content,
        topic: selectedTopic,
        framework: selectedFramework,
        enhanceStrategy: selectedStrategy,
        keywords: selectedTopic?.keywords,
        status: "draft",
      }),
    });
    setProgressText("已保存");
  };

  return (
    <div className="flex h-full">
      {/* ── Left: Editor ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-black/[0.06]">
        {/* Title bar */}
        <div className="px-5 pt-5 pb-3 border-b border-black/[0.06] bg-[#fafafa]">
          <input
            className="w-full text-[21px] font-semibold tracking-[-0.374px] bg-transparent outline-none placeholder:text-[rgba(0,0,0,0.2)]"
            placeholder="输入文章标题..."
            value={article.title || selectedTopic?.title || ""}
            onChange={(e) => setArticle({ title: e.target.value })}
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] border-0 text-[rgba(0,0,0,0.48)]">
              {selectedFramework}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] border-0 text-[rgba(0,0,0,0.48)]">
              {selectedStrategy}
            </Badge>
            {streamedContent && (
              <span className="text-[12px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px]">
                {streamedContent.replace(/[#*`>\n]/g, "").length.toLocaleString()} 字
              </span>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-auto p-5">
          {generating && !streamedContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
              <p className="text-[14px] text-[rgba(0,0,0,0.48)] tracking-[-0.224px]">
                正在构思文章结构...
              </p>
              <Progress value={progress} className="w-48 h-[3px]" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="w-full h-full min-h-[400px] bg-transparent outline-none resize-none"
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
                setStreamedContent(e.target.value);
                setArticle({ content: e.target.value });
              }}
            />
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="px-5 py-3 border-t border-black/[0.06] bg-[#fafafa] flex items-center gap-2">
          {generating ? (
            <Button variant="outline" size="sm" onClick={handleStop} className="h-9 gap-1.5 text-[14px] border-[rgba(0,0,0,0.08)]">
              停止
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startWriting}
              className="h-9 gap-1.5 text-[14px] border-[rgba(0,0,0,0.08)]"
            >
              <RotateCcw className="h-4 w-4" />
              重新生成
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-[14px] border-[rgba(0,0,0,0.08)]"
            onClick={handleSave}
            disabled={!streamedContent}
          >
            <Save className="h-4 w-4" />
            保存草稿
          </Button>

          <div className="flex-1" />

          {streamedContent && (
            <Button
              size="pill-sm"
              variant="pill-filled"
              className="gap-1.5 h-10 px-5"
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
        <div className="px-5 py-3 border-b border-black/[0.06] bg-white">
          <span className="text-[12px] font-medium tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
            实时预览
          </span>
        </div>
        <div className="p-5">
          <Card className="bg-white rounded-2xl">
            <div className="p-6">
              {streamedContent ? (
                <div
                  className="text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]"
                  dangerouslySetInnerHTML={{
                    __html: streamedContent
                      .replace(/^### (.+)$/gm, "<h3 style='font-size:21px;font-weight:700;margin:16px 0 8px;'>$1</h3>")
                      .replace(/^## (.+)$/gm, "<h2 style='font-size:28px;font-weight:600;margin:20px 0 10px;'>$1</h2>")
                      .replace(/^# (.+)$/gm, "<h1 style='font-size:34px;font-weight:700;margin:24px 0 12px;'>$1</h1>")
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.+?)\*/g, "<em>$1</em>")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              ) : (
                <p className="text-[14px] text-[rgba(0,0,0,0.16)]">
                  写作内容将在这里实时预览...
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
