"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Search,
  Image,
  Loader2,
  CheckCircle2,
  Sparkles,
  Tag,
} from "lucide-react";

export function SeoImageStep() {
  const { article, setArticle, nextStep } = usePipelineStore();
  const [seoLoading, setSeoLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // 生成 SEO 元数据
  const generateSEO = async () => {
    if (!article.content) return;
    setSeoLoading(true);
    try {
      const res = await fetch("/api/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.content, title: article.title }),
      });
      const data = await res.json();
      setArticle({
        seoTitle: data.seoTitle,
        seoAbstract: data.abstract,
        seoTags: data.tags,
      });
    } finally {
      setSeoLoading(false);
    }
  };

  // 生成封面图
  const generateCover = async () => {
    setImageLoading(true);
    try {
      const res = await fetch("/api/ai/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: article.title, content: article.content }),
      });
      const data = await res.json();
      setArticle({ coverImageUrl: data.imageUrl, coverPrompt: data.prompt });
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">SEO + 配图</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          生成 SEO 标题、摘要、标签，以及文章封面图
        </p>
      </div>

      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seo" className="gap-1.5 text-[12px]">
            <Search className="h-3.5 w-3.5" />
            SEO 元数据
          </TabsTrigger>
          <TabsTrigger value="cover" className="gap-1.5 text-[12px]">
            <Image className="h-3.5 w-3.5" />
            封面图
          </TabsTrigger>
        </TabsList>

        {/* SEO 元数据 */}
        <TabsContent value="seo" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="gap-1.5 bg-blue-500 hover:bg-blue-600"
              onClick={generateSEO}
              disabled={seoLoading || !article.content}
            >
              {seoLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI 生成
            </Button>
          </div>

          {/* SEO 标题 */}
          <div className="space-y-2">
            <Label className="text-[12px] font-medium">SEO 标题（建议 20-28 字）</Label>
            <Input
              value={article.seoTitle ?? ""}
              onChange={(e) => setArticle({ seoTitle: e.target.value })}
              placeholder="让算法和读者都喜欢的标题..."
              className="text-[14px]"
            />
            {article.seoTitle && (
              <p className="text-[11px] text-muted-foreground">
                {article.seoTitle.length} 字
              </p>
            )}
          </div>

          {/* 摘要 */}
          <div className="space-y-2">
            <Label className="text-[12px] font-medium">摘要（建议 40 字以内）</Label>
            <Input
              value={article.seoAbstract ?? ""}
              onChange={(e) => setArticle({ seoAbstract: e.target.value })}
              placeholder="一句话概括文章价值..."
              className="text-[14px]"
            />
            {article.seoAbstract && (
              <p className="text-[11px] text-muted-foreground">
                {article.seoAbstract.length} 字
              </p>
            )}
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label className="text-[12px] font-medium">标签</Label>
            <div className="flex flex-wrap gap-2">
              {(article.seoTags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[11px] gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
              {(article.seoTags ?? []).length === 0 && (
                <p className="text-[12px] text-muted-foreground">点击 AI 生成获取标签</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 封面图 */}
        <TabsContent value="cover" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="gap-1.5 bg-blue-500 hover:bg-blue-600"
              onClick={generateCover}
              disabled={imageLoading || !article.title}
            >
              {imageLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {imageLoading ? "生成中..." : "生成封面图"}
            </Button>
            <span className="text-[12px] text-muted-foreground">
              基于标题和内容生成创意封面
            </span>
          </div>

          {article.coverImageUrl ? (
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-[16:9] rounded-lg overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.coverImageUrl}
                    alt="封面图"
                    className="w-full h-full object-cover"
                  />
                </div>
                {article.coverPrompt && (
                  <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                    Prompt: {article.coverPrompt}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <Image className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-[12px] text-muted-foreground">
                  点击上方按钮生成封面图
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 下一步 */}
      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          onClick={nextStep}
        >
          排版发布
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
