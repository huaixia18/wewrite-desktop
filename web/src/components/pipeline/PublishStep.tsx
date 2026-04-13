"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Send,
  Eye,
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Code,
  Smartphone,
} from "lucide-react";

// 16 套排版主题
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

const THEME_CSS: Record<string, string> = {
  "professional-clean": "font-family: 'PingFang SC', sans-serif; --theme-accent: #0071e3;",
  minimal: "font-family: 'PingFang SC', sans-serif; --theme-accent: #1d1d1f;",
  newspaper: "font-family: 'Songti SC', serif; --theme-accent: #000;",
  "tech-modern": "font-family: 'PingFang SC', sans-serif; --theme-accent: #2997ff;",
  bytedance: "font-family: 'PingFang SC', sans-serif; --theme-accent: #fe2c55;",
  github: "font-family: 'SF Mono', monospace; --theme-accent: #238636;",
};

export function PublishStep() {
  const { article, setArticle, resetPipeline } = usePipelineStore();
  const [selectedTheme, setSelectedTheme] = useState("professional-clean");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);

  // 生成微信 HTML 预览
  const generatePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          theme: selectedTheme,
          coverImageUrl: article.coverImageUrl,
        }),
      });
      const data = await res.json();
      setPreviewHtml(data.html);
    } finally {
      setLoading(false);
    }
  };

  // 复制 HTML
  const copyHtml = () => {
    navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 推送到微信草稿箱
  const publishToWechat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.seoTitle || article.title,
          content: previewHtml,
          coverImageUrl: article.coverImageUrl,
          abstract: article.seoAbstract,
        }),
      });
      const data = await res.json();
      if (data.mediaId) {
        setArticle({ mediaId: data.mediaId });
        setPublished(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 模拟预览 HTML（实时展示）
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
      {/* 左侧：主题选择 */}
      <div className="w-[260px] shrink-0 border-r overflow-auto p-4 space-y-4">
        <div>
          <h2 className="text-[13px] font-semibold">排版主题</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">共 12 套主题</p>
        </div>
        <div className="space-y-1.5">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-all text-[12px] flex items-center gap-2",
                selectedTheme === theme.id
                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <span>{theme.emoji}</span>
              <span className="flex-1">{theme.name}</span>
              <Badge variant="outline" className="text-[9px]">
                {theme.category}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* 中间：预览 */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[12px] h-7"
              onClick={generatePreview}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              刷新预览
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[12px] h-7"
              onClick={copyHtml}
              disabled={!previewHtml}
            >
              {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制 HTML"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-[12px] h-7 bg-green-600 hover:bg-green-700"
              onClick={publishToWechat}
              disabled={loading || !previewHtml}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              推送草稿箱
            </Button>
          </div>
        </div>

        {/* 手机预览 */}
        <div className="flex items-center justify-center p-6">
          <div className="w-[375px] border rounded-[40px] shadow-xl overflow-hidden bg-white">
            <div className="h-8 bg-black flex items-center justify-center">
              <div className="w-20 h-5 bg-black rounded-full" />
            </div>
            <div className="overflow-auto" style={{ height: "calc(100vh - 100px)" }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml || livePreviewHtml }} />
            </div>
          </div>
        </div>

        {/* 发布成功 */}
        {published && (
          <Card className="mx-6 mb-6 bg-green-50/50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-[13px] font-medium text-green-700">已推送到微信草稿箱</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  media_id: {article.mediaId}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5 h-7 text-[11px]"
                onClick={resetPipeline}
              >
                再写一篇
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 右侧：元数据 */}
      <div className="w-[220px] shrink-0 border-l overflow-auto p-4 space-y-4">
        <div>
          <h2 className="text-[13px] font-semibold">发布信息</h2>
        </div>

        <div className="space-y-3 text-[12px]">
          <div>
            <span className="text-muted-foreground">标题</span>
            <p className="font-medium mt-0.5">{article.seoTitle || article.title || "—"}</p>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">摘要</span>
            <p className="mt-0.5 leading-relaxed">{article.seoAbstract || "—"}</p>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">标签</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(article.seoTags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">字数</span>
            <p className="font-medium mt-0.5">{article.wordCount ?? "—"} 字</p>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">人类感评分</span>
            <p className="font-medium mt-0.5">
              {article.humanizerReport?.score ?? "—"} 分
            </p>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">主题</span>
            <p className="font-medium mt-0.5">{THEMES.find((t) => t.id === selectedTheme)?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
