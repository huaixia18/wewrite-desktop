"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Loader2,
  PenLine,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";

interface Article {
  id: string;
  title: string;
  status: string;
  wordCount: number | null;
  compositeScore: number | null;
  humanizerHits: number;
  seoTags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ArticleListResponse {
  articles?: Article[];
}

const statusMap: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "归档",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function HistoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("draft");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchJson<ArticleListResponse>(`/api/articles?status=${activeTab}`);
      setArticles(data.articles ?? []);
    } catch (err) {
      setArticles([]);
      setLoadError(getErrorMessage(err, "文章列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const stats = useMemo(() => {
    const totalWords = articles.reduce((sum, article) => sum + (article.wordCount ?? 0), 0);
    const averageScore = articles.length
      ? Math.round(
          articles.reduce((sum, article) => sum + (article.compositeScore ?? 0), 0) /
            articles.length
        )
      : 0;

    return {
      totalWords,
      averageScore,
      count: articles.length,
    };
  }, [articles]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <section className="px-4 pt-4 md:px-6">
        <div className="apple-container rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[rgba(0,0,0,0.04)_0_8px_20px_-12px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.42)]">内容库</p>
              <h1 className="mt-1 text-[26px] font-semibold leading-[1.2] tracking-[-0.24px] text-[#0f172a]">
                历史文章
              </h1>
              <p className="mt-1 text-[13px] leading-[1.5] tracking-[-0.12px] text-[rgba(0,0,0,0.52)]">
                按状态筛选并快速回到编辑节点，避免在页面间反复跳转。
              </p>
            </div>

            <Link href="/write">
              <Button variant="pill-filled" className="h-10 gap-2 px-5 text-[14px]">
                <PenLine className="h-4 w-4" />
                写新文章
              </Button>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="soft" className="bg-[#2563eb]/10 text-[#1d4ed8]">
              当前列表 {statusMap[activeTab] ?? activeTab} · {stats.count} 篇
            </Badge>
            <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
              累计字数 {stats.totalWords.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="border-black/[0.08] text-[rgba(0,0,0,0.62)]">
              平均评分 {stats.averageScore}
            </Badge>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="apple-container px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full overflow-x-auto lg:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList variant="default" className="w-max bg-[#e9e9ee] p-1">
                  <TabsTrigger value="draft" className="shrink-0">草稿</TabsTrigger>
                  <TabsTrigger value="published" className="shrink-0">已发布</TabsTrigger>
                  <TabsTrigger value="archived" className="shrink-0">归档</TabsTrigger>
                </TabsList>
              </div>

              <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                {loading
                  ? "正在整理文章列表..."
                  : loadError
                  ? "列表加载失败"
                  : `共整理出 ${articles.length} 篇文章`}
              </p>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading && (
                <div className="flex min-h-[320px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
                </div>
              )}

              {!loading && loadError && (
                <div className="apple-panel flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <div className="w-full max-w-[480px]">
                    <StepStatusAlert
                      variant="error"
                      title="读取失败"
                      description={loadError}
                      actionLabel="重新加载"
                      onAction={() => void fetchArticles()}
                    />
                  </div>
                </div>
              )}

              {!loading && !loadError && articles.length === 0 && (
                <div className="apple-panel flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7]">
                    <FileText className="h-7 w-7 text-[rgba(0,0,0,0.2)]" />
                  </div>
                  <p className="mt-6 text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                    暂无{statusMap[activeTab] ?? activeTab}文章
                  </p>
                  <p className="mt-2 max-w-[360px] text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                    当你开始写作、保存草稿或发布文章后，它们会自动出现在这里。
                  </p>
                  <Link href="/write">
                    <Button variant="pill-filled" className="mt-6 h-10 gap-2 px-5 text-[14px]">
                      去写作
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}

              {!loading && !loadError && articles.length > 0 && (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Card
                      key={article.id}
                      className="rounded-[28px] bg-white p-0 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex flex-col gap-5 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={article.status === "published" ? "default" : "outline"}>
                                {statusMap[article.status] ?? article.status}
                              </Badge>
                              {article.seoTags?.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="border-black/[0.06] bg-[#f5f5f7] text-[rgba(0,0,0,0.56)]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <h2 className="mt-4 text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                              {article.title}
                            </h2>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/write?draft=${article.id}`}>
                              <Button variant="pill-outline" className="h-10 gap-2 px-4 text-[13px]">
                                继续编辑
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                            <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                              字数
                            </p>
                            <p className="mt-2 text-[18px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                              {(article.wordCount ?? 0).toLocaleString()} 字
                            </p>
                          </div>
                          <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                            <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                              质量评分
                            </p>
                            <p className="mt-2 text-[18px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                              {Math.round(article.compositeScore ?? 0)}
                            </p>
                          </div>
                          <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                            <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                              去 AI 命中
                            </p>
                            <p className="mt-2 text-[18px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                              {article.humanizerHits} 条
                            </p>
                          </div>
                          <div className="rounded-[20px] bg-[#f5f5f7] p-4">
                            <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                              更新时间
                            </p>
                            <p className="mt-2 text-[18px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                              {formatDate(article.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
                          <div className="flex items-center gap-2 text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                            <Shield className="h-4 w-4 text-[#0071e3]" />
                            {article.status === "published"
                              ? "已完成发布，可继续回看数据表现"
                              : "仍可继续润色、去 AI 化和补充 SEO"}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                            <Sparkles className="h-4 w-4 text-[#0071e3]" />
                            创建于 {formatDate(article.createdAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
