"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import { ChevronRight, ImageIcon, Loader2, Sparkles } from "lucide-react";

/* ─── Step 6: Visual AI ─────────────────────────────────────────────────── */
export function SeoImageStep() {
  const {
    article,
    setArticle,
    nextStep,
    markStepDone,
    setRuntime,
    runtime,
    setProgressText,
  } = usePipelineStore();
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (article.coverImageUrl) {
      markStepDone();
    }
  }, [article.coverImageUrl, markStepDone]);

  const generateCover = async () => {
    setError("");
    setImageLoading(true);
    setProgressText("正在生成封面图...");
    try {
      const data = await fetchJson<{
        imageUrl: string;
        prompt: string;
        meta?: { mode?: "live"; provider?: string };
      }>("/api/ai/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: article.title, content: article.content }),
      });
      setArticle({ coverImageUrl: data.imageUrl, coverPrompt: data.prompt });
      setRuntime({
        aiMode: data.meta?.mode ?? runtime.aiMode,
        aiProvider: data.meta?.provider ?? runtime.aiProvider,
      });
      setProgressText("封面图生成完成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "封面图生成失败";
      setError(message);
      setProgressText("封面图生成失败");
      toast.error(message);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      <div>
        <h2 className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]">
          视觉 AI
        </h2>
        <p className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
          为当前文章生成封面与视觉素材
        </p>
        <p className="mt-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.42)]">
          AI 模式：{runtime.aiMode === "live" ? `真实服务（${runtime.aiProvider}）` : "待检测"}
        </p>
      </div>

      {error && (
        <StepStatusAlert
          variant="error"
          title="视觉生成失败"
          description={error}
        />
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="gap-2 h-10 px-5"
          onClick={generateCover}
          disabled={imageLoading || !article.title}
        >
          {imageLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {imageLoading ? "生成中..." : "生成封面图"}
        </Button>
        <span className="text-[13px] text-[rgba(0,0,0,0.32)] tracking-[-0.224px]">
          基于标题与正文语义生成视觉风格
        </span>
      </div>

      {article.coverImageUrl ? (
        <Card className="rounded-2xl overflow-hidden ring-1 ring-black/[0.06]">
          <div className="relative aspect-[16:9] bg-[#f5f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImageUrl}
              alt="封面图"
              className="w-full h-full object-cover"
            />
          </div>
          {article.coverPrompt && (
            <div className="p-4">
              <p className="text-[12px] text-[rgba(0,0,0,0.32)] font-mono leading-[1.4]">
                {article.coverPrompt}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-white ring-1 ring-dashed ring-black/[0.08]">
          <ImageIcon className="h-10 w-10 text-[rgba(0,0,0,0.12)]" />
          <p className="text-[14px] text-[rgba(0,0,0,0.32)] mt-3 tracking-[-0.224px]">
            点击上方按钮生成封面图
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="gap-1.5 h-10 px-5"
          onClick={nextStep}
          disabled={!article.coverImageUrl}
        >
          排版发布
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
