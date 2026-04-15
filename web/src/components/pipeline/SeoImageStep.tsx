"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import {
  ChevronRight,
  Search,
  ImageIcon,
  Loader2,
  Sparkles,
  Tag,
} from "lucide-react";

/* ─── Apple Step: SEO + Cover ──────────────────────────────────────────── */
export function SeoImageStep() {
  const {
    article,
    setArticle,
    nextStep,
    markStepDone,
    runMode,
    setRuntime,
    runtime,
    setProgressText,
  } = usePipelineStore();
  const [seoLoading, setSeoLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const autoRanRef = useRef(false);

  // Signal done when SEO title or cover image is ready
  useEffect(() => {
    if (article.seoTitle || article.coverImageUrl) {
      markStepDone();
    }
  }, [article.seoTitle, article.coverImageUrl, markStepDone]);

  const generateSEO = useCallback(async () => {
    if (!article.content) return;
    setError("");
    setSeoLoading(true);
    setProgressText("正在生成 SEO 元数据...");
    try {
      const data = await fetchJson<{
        seoTitle: string;
        abstract: string;
        tags: string[];
        meta?: { mode?: "live" | "mock"; provider?: string };
      }>("/api/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.content, title: article.title }),
      });
      setArticle({
        seoTitle: data.seoTitle,
        seoAbstract: data.abstract,
        seoTags: data.tags,
      });
      setRuntime({
        aiMode: data.meta?.mode ?? runtime.aiMode,
        aiProvider: data.meta?.provider ?? runtime.aiProvider,
      });
      if (data.meta?.mode === "mock") {
        toast.warning("SEO 结果来自 Mock 模式，AI 服务暂未就绪。");
      }
      setProgressText("SEO 生成完成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "SEO 生成失败";
      setError(message);
      setProgressText("SEO 生成失败");
      toast.error(message);
    } finally {
      setSeoLoading(false);
    }
  }, [article.content, article.title, runtime.aiMode, runtime.aiProvider, setArticle, setProgressText, setRuntime]);

  // Auto-generate SEO in auto mode when entering this step
  useEffect(() => {
    if (runMode === "auto" && article.content && !autoRanRef.current) {
      autoRanRef.current = true;
      void generateSEO();
    }
  }, [runMode, article.content, generateSEO]);

  const generateCover = async () => {
    setError("");
    setImageLoading(true);
    setProgressText("正在生成封面图...");
    try {
      const data = await fetchJson<{
        imageUrl: string;
        prompt: string;
        meta?: { mode?: "live" | "mock"; provider?: string };
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
      if (data.meta?.mode === "mock") {
        toast.info("封面图使用了占位生成模式，可先用于排版预览。");
      }
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
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]">
          SEO + 配图
        </h2>
        <p className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
          生成 SEO 标题、摘要、标签，以及文章封面图
        </p>
        <p className="mt-2 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.42)]">
          AI 模式：{runtime.aiMode === "live" ? `真实服务（${runtime.aiProvider}）` : runtime.aiMode === "mock" ? "Mock 模式" : "待检测"}
        </p>
      </div>

      {error && (
        <StepStatusAlert
          variant="error"
          title="SEO / 配图执行失败"
          description={error}
        />
      )}

      <Tabs defaultValue="seo" className="space-y-5">
        <TabsList variant="default" className="bg-transparent p-0 gap-1">
          {[
            { value: "seo", label: "SEO 元数据", icon: Search },
            { value: "cover", label: "封面图", icon: ImageIcon },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-full px-[18px] py-[7px] text-[14px] font-medium text-[#1d1d1f] hover:bg-black/[0.04] data-[active]:bg-[#1d1d1f] data-[active]:text-white aria-selected:bg-[#1d1d1f] aria-selected:text-white data-selected:bg-[#1d1d1f] data-selected:text-white"
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="mt-0 space-y-5">
          <Button
            variant="pill-filled"
            size="pill-sm"
            className="gap-2 h-10 px-5"
            onClick={generateSEO}
            disabled={seoLoading || !article.content}
          >
            {seoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI 生成
          </Button>

          <div className="bg-white rounded-2xl p-5 space-y-5 ring-1 ring-black/[0.06]">
            {/* SEO Title */}
            <div className="space-y-2">
              <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                SEO 标题（建议 20–28 字）
              </Label>
              <Input
                value={article.seoTitle ?? ""}
                onChange={(e) => setArticle({ seoTitle: e.target.value })}
                placeholder="让算法和读者都喜欢的标题..."
                className="h-11"
              />
              {article.seoTitle && (
                <p className="text-[12px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px]">
                  {article.seoTitle.length} 字
                </p>
              )}
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                摘要（建议 40 字以内）
              </Label>
              <Input
                value={article.seoAbstract ?? ""}
                onChange={(e) => setArticle({ seoAbstract: e.target.value })}
                placeholder="一句话概括文章价值..."
                className="h-11"
              />
              {article.seoAbstract && (
                <p className="text-[12px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px]">
                  {article.seoAbstract.length} 字
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                标签
              </Label>
              <div className="flex flex-wrap gap-2">
                {(article.seoTags ?? []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[12px] font-medium tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0 gap-1.5"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
                {(article.seoTags ?? []).length === 0 && (
                  <p className="text-[13px] text-[rgba(0,0,0,0.32)]">
                    点击 AI 生成获取标签
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Cover Tab */}
        <TabsContent value="cover" className="mt-0 space-y-5">
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
              基于标题和内容生成创意封面
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
        </TabsContent>
      </Tabs>

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="gap-1.5 h-10 px-5"
          onClick={nextStep}
        >
          排版发布
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
