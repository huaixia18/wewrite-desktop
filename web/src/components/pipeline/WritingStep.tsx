"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Wand2,
  ChevronRight,
  Save,
  Eye,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

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
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 行
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
              // 模拟进度
              setProgress((p) => Math.min(p + 2, 95));
            } else if (parsed.type === "title") {
              setArticle({ title: parsed.text });
            } else if (parsed.type === "done") {
              setDone(true);
              setProgress(100);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      // 保存文章
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
    generating,
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    materials,
    setArticle,
    setProgressText,
    streamedContent,
  ]);

  // 自动开始
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
      {/* 左侧：写作面板 */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        {/* 标题输入 */}
        <div className="px-4 pt-4 pb-2 border-b bg-muted/20">
          <input
            className="w-full text-[18px] font-semibold bg-transparent outline-none placeholder:text-muted-foreground/40"
            placeholder="输入文章标题..."
            value={article.title || selectedTopic?.title || ""}
            onChange={(e) => setArticle({ title: e.target.value })}
          />
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px]">
              {selectedFramework}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {selectedStrategy}
            </Badge>
            {streamedContent && (
              <span className="text-[11px] text-muted-foreground">
                {streamedContent.replace(/[#*`>\n]/g, "").length} 字
              </span>
            )}
          </div>
        </div>

        {/* 内容编辑器 */}
        <div className="flex-1 overflow-auto p-4">
          {generating && !streamedContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-[13px] text-muted-foreground">正在构思文章结构...</p>
              <Progress value={progress} className="w-48" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="w-full h-full min-h-[400px] bg-transparent outline-none resize-none text-[14px] leading-relaxed font-mono"
              placeholder="写作内容将在这里实时显示..."
              value={streamedContent}
              onChange={(e) => {
                setStreamedContent(e.target.value);
                setArticle({ content: e.target.value });
              }}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-4 py-3 border-t bg-muted/20 flex items-center gap-2">
          {generating ? (
            <Button variant="outline" size="sm" onClick={handleStop} className="gap-1.5">
              停止
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startWriting}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重新生成
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleSave}
            disabled={!streamedContent}
          >
            <Save className="h-3.5 w-3.5" />
            保存草稿
          </Button>

          <div className="flex-1" />

          {streamedContent && (
            <Button
              size="sm"
              className="gap-1.5 bg-blue-500 hover:bg-blue-600"
              onClick={nextStep}
            >
              去 AI 化
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 右侧：实时预览 */}
      <div className="w-[420px] shrink-0 overflow-auto bg-muted/10">
        <div className="px-4 py-3 border-b">
          <span className="text-[12px] font-medium text-muted-foreground">实时预览</span>
        </div>
        <div className="p-4">
          <Card>
            <CardContent className="p-6 text-[14px] leading-relaxed prose prose-sm max-w-none">
              {streamedContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: streamedContent
                      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.+?)\*/g, "<em>$1</em>")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              ) : (
                <p className="text-muted-foreground/40 text-[13px]">
                  写作内容将在这里实时预览...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
