"use client";

import { useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/http";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

export function WrapUpStep() {
  const {
    article,
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    runtime,
    runMode,
    setArticle,
    setProgressText,
    resetPipeline,
  } = usePipelineStore();
  const [archiving, setArchiving] = useState(false);
  const [archivedAt, setArchivedAt] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const archivedOnceRef = useRef(false);

  useEffect(() => {
    setProgressText("本轮流程已完成");
  }, [setProgressText]);

  useEffect(() => {
    if (archivedOnceRef.current) return;
    if (!article.content?.trim() && !article.title?.trim()) return;
    archivedOnceRef.current = true;

    let cancelled = false;
    const archive = async () => {
      setArchiving(true);
      setArchiveError("");
      try {
        const data = await fetchJson<{
          article: { id: string; status: string; updatedAt: string };
        }>("/api/articles/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: article.id,
            title: article.title,
            content: article.content,
            htmlContent: article.htmlContent,
            topic: article.topic ?? selectedTopic ?? undefined,
            framework: article.framework ?? selectedFramework,
            enhanceStrategy: article.enhanceStrategy ?? selectedStrategy,
            keywords: article.keywords ?? selectedTopic?.keywords ?? [],
            wordCount: article.wordCount,
            compositeScore: article.compositeScore,
            qualityReport: article.humanizerReport ? { humanizer: article.humanizerReport } : undefined,
            humanizerReport: article.humanizerReport,
            seoTitle: article.seoTitle,
            seoAbstract: article.seoAbstract,
            seoTags: article.seoTags ?? [],
            coverImageUrl: article.coverImageUrl,
            coverPrompt: article.coverPrompt,
            mediaId: article.mediaId,
            archiveMeta: {
              pipelineVersion: "v2",
              runMode,
              runtime,
            },
          }),
        });
        if (cancelled) return;
        setArticle({ id: data.article.id });
        setArchivedAt(data.article.updatedAt);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "归档失败";
        setArchiveError(message);
      } finally {
        if (!cancelled) {
          setArchiving(false);
        }
      }
    };

    void archive();
    return () => {
      cancelled = true;
    };
  }, [
    article.compositeScore,
    article.content,
    article.coverImageUrl,
    article.coverPrompt,
    article.enhanceStrategy,
    article.framework,
    article.humanizerReport,
    article.htmlContent,
    article.id,
    article.keywords,
    article.mediaId,
    article.seoAbstract,
    article.seoTags,
    article.seoTitle,
    article.title,
    article.topic,
    article.wordCount,
    runMode,
    runtime,
    selectedFramework,
    selectedStrategy,
    selectedTopic,
    setArticle,
  ]);

  return (
    <div className="max-w-[960px] mx-auto px-6 py-6 space-y-5">
      <div className="rounded-2xl border border-[#34c759]/20 bg-[#34c759]/8 p-5">
        <div className="flex items-center gap-2 text-[#1d1d1f]">
          <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
          <h2 className="text-[24px] font-semibold tracking-[-0.3px]">任务收尾</h2>
        </div>
        <p className="mt-2 text-[14px] text-[rgba(0,0,0,0.52)]">
          写作流程已完成，可直接开启下一篇任务。
        </p>
        <div className="mt-3 text-[12px] text-[rgba(0,0,0,0.52)]">
          {archiving ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              正在归档本次任务...
            </span>
          ) : archiveError ? (
            <span>归档失败：{archiveError}</span>
          ) : archivedAt ? (
            <span>
              已归档：{new Date(archivedAt).toLocaleString("zh-CN", { hour12: false })}
            </span>
          ) : (
            <span>待归档</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
        <p className="text-[15px] font-semibold text-[#1d1d1f]">本次摘要</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft" className="bg-[#0071e3]/10 text-[#1d4ed8]">
            选题：{selectedTopic?.title ?? "未命名"}
          </Badge>
          <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
            框架：{selectedFramework ?? "未设置"}
          </Badge>
          <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
            策略：{selectedStrategy ?? "未设置"}
          </Badge>
          <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
            字数：{article.wordCount ?? 0}
          </Badge>
          {article.compositeScore !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "border-0",
                article.compositeScore < 30
                  ? "bg-emerald-50 text-emerald-700"
                  : article.compositeScore < 50
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              质量分：{article.compositeScore}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="h-10 gap-1.5 px-5"
          onClick={resetPipeline}
        >
          <RotateCcw className="h-4 w-4" />
          开始新任务
        </Button>
      </div>
    </div>
  );
}
