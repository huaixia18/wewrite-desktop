"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import {
  Send,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";

/* ─── Apple Step: Publish ───────────────────────────────────────────────
 * Theme picker + phone mockup preview + WeChat publish
 */
const THEMES = [
  { id: "professional-clean", name: "专业简洁", emoji: "📄", category: "通用" },
  { id: "minimal", name: "极简", emoji: "⬜", category: "通用" },
  { id: "newspaper", name: "报纸风", emoji: "📰", category: "通用" },
  { id: "tech-modern", name: "科技感", emoji: "🚀", category: "科技" },
  { id: "bytedance", name: "字节风", emoji: "💠", category: "科技" },
  { id: "github", name: "GitHub", emoji: "⚡", category: "科技" },
  { id: "warm-editorial", name: "温暖编辑", emoji: "🌸", category: "文学" },
  { id: "sspai", name: "少数派", emoji: "🎨", category: "文学" },
  { id: "ink", name: "墨水", emoji: "🖋️", category: "文学" },
  { id: "bold-navy", name: "深海蓝", emoji: "🌊", category: "商业" },
  { id: "minimal-gold", name: "金色极简", emoji: "✨", category: "商业" },
  { id: "bold-green", name: "森林绿", emoji: "🌲", category: "商业" },
];

export function PublishStep() {
  const { article, setArticle, resetPipeline, setRuntime, runtime, setProgressText } = usePipelineStore();
  const [selectedTheme, setSelectedTheme] = useState("professional-clean");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");
  const [isBetaPublish, setIsBetaPublish] = useState(false);

  const generatePreview = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchJson<{ html: string }>("/api/articles/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          theme: selectedTheme,
          coverImageUrl: article.coverImageUrl,
        }),
      });
      setPreviewHtml(data.html);
      setProgressText("预览生成完成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "预览生成失败";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publishToWechat = async () => {
    setError("");
    setLoading(true);
    setProgressText("正在推送到微信草稿箱...");
    try {
      const data = await fetchJson<{
        mediaId?: string;
        message?: string;
        mode?: "live" | "mock";
        beta?: boolean;
      }>("/api/articles/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.seoTitle || article.title,
          content: previewHtml,
          coverImageUrl: article.coverImageUrl,
          abstract: article.seoAbstract,
        }),
      });
      setRuntime({ publishMode: data.mode ?? "unknown" });
      setPublishMessage(data.message ?? "");
      setIsBetaPublish(Boolean(data.beta || data.mode === "mock"));
      if (data.mediaId) {
        setArticle({ mediaId: data.mediaId });
        setPublished(true);
      }
      if (data.mode === "mock") {
        toast.warning("当前为 Beta 模拟发布，尚未调用真实微信接口。");
      } else {
        toast.success("已推送到微信草稿箱");
      }
      setProgressText(data.mode === "mock" ? "Beta 模拟发布完成" : "发布完成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "发布失败";
      setError(message);
      setProgressText("发布失败");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const livePreviewHtml = `
    <div style="font-family: 'PingFang SC', sans-serif; max-width: 677px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; line-height: 1.4;">
        ${article.title || article.seoTitle || "文章标题"}
      </h1>
      ${article.coverImageUrl ? `<img src="${article.coverImageUrl}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" />` : ""}
      <div style="font-size: 15px; line-height: 1.8; color: #444;">
        ${(article.content || "").split("\n").slice(0, 5).map((l) => `<p style="margin: 0 0 12px 0;">${l}</p>`).join("")}
      </div>
    </div>
  `;

  return (
    <div className="flex h-full">
      {/* ── Left: Theme Picker ── */}
      <div className="w-[260px] shrink-0 border-r border-black/[0.06] overflow-auto p-5 space-y-4 bg-[#fafafa]">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
            排版主题
          </h2>
          <p className="text-[13px] text-[rgba(0,0,0,0.32)] mt-0.5 tracking-[-0.224px]">
            共 {THEMES.length} 套主题
          </p>
        </div>
        <div className="space-y-1.5">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3",
                selectedTheme === theme.id
                  ? "bg-[#0071e3]/8 ring-2 ring-[#0071e3]/30"
                  : "hover:bg-black/[0.03]"
              )}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <span className="text-[20px] leading-none">{theme.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f]">
                  {theme.name}
                </p>
                <p className="text-[11px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px] mt-0.5">
                  {theme.category}
                </p>
              </div>
              {selectedTheme === theme.id && (
                <CheckCircle2 className="h-4 w-4 text-[#0071e3] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: Preview ── */}
      <div className="flex-1 overflow-auto bg-[#f5f5f7]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-[14px] border-[rgba(0,0,0,0.08)]"
              onClick={generatePreview}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              刷新预览
            </Button>
            <Badge
              variant="outline"
              className="border-black/[0.08] bg-[#f5f5f7] text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.56)]"
            >
              发布链路：{runtime.publishMode === "mock" ? "Beta 模拟" : runtime.publishMode === "live" ? "真实发布" : "待检测"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-[14px] border-[rgba(0,0,0,0.08)]"
              onClick={copyHtml}
              disabled={!previewHtml}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-[#34c759]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "已复制" : "复制 HTML"}
            </Button>
            <Button
              variant="pill-filled"
              size="pill-sm"
              className="gap-1.5 h-9 px-5"
              onClick={publishToWechat}
              disabled={loading || !previewHtml}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              推送草稿箱
            </Button>
          </div>
        </div>

        {/* Phone mockup */}
        {error && (
          <div className="px-6 pt-6">
            <StepStatusAlert
              variant="error"
              title="发布步骤失败"
              description={error}
            />
          </div>
        )}

        <div className="flex items-center justify-center p-8">
          <div className="w-[375px] rounded-[40px] overflow-hidden shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] bg-white border border-black/[0.06]">
            {/* Notch */}
            <div className="h-12 bg-black flex items-center justify-center">
              <div className="w-28 h-6 bg-black rounded-full" />
            </div>
            {/* Content */}
            <div
              className="overflow-auto"
              style={{ height: "calc(100vh - 200px)" }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: previewHtml || livePreviewHtml,
                }}
              />
            </div>
          </div>
        </div>

        {/* Published success */}
        {published && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-[#34c759]/8 border border-[#34c759]/20 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#34c759] shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-[#1d1d1f]">
                {isBetaPublish ? "Beta 模拟推送完成" : "已推送到微信草稿箱"}
              </p>
              <p className="text-[12px] text-[rgba(0,0,0,0.48)] mt-0.5">
                media_id: {article.mediaId}
              </p>
              {publishMessage && (
                <p className="text-[12px] text-[rgba(0,0,0,0.48)] mt-0.5">
                  {publishMessage}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-8 text-[13px] border-[rgba(0,0,0,0.08)]"
              onClick={resetPipeline}
            >
              再写一篇
            </Button>
          </div>
        )}
      </div>

      {/* ── Right: Meta ── */}
      <div className="w-[220px] shrink-0 border-l border-black/[0.06] overflow-auto p-5 space-y-4 bg-[#fafafa]">
        <div>
          <h2 className="text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
            发布信息
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { label: "标题", value: article.seoTitle || article.title || "—" },
            { label: "摘要", value: article.seoAbstract || "—" },
            { label: "字数", value: `${article.wordCount ?? "—"} 字` },
            { label: "人类感评分", value: `${article.humanizerReport?.score ?? "—"} 分` },
            { label: "主题", value: THEMES.find((t) => t.id === selectedTheme)?.name },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-[12px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px]">{label}</p>
              <p className="text-[13px] font-medium tracking-[-0.224px] text-[#1d1d1f] leading-[1.3]">
                {value}
              </p>
            </div>
          ))}

          <Separator />

          <div className="space-y-1.5">
            <p className="text-[12px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px]">标签</p>
            <div className="flex flex-wrap gap-1">
              {(article.seoTags ?? []).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
