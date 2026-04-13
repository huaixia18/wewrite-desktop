"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  BarChart2,
  Trash2,
  PenLine,
  Loader2,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react";

/* ─── Apple History Page ────────────────────────────────────────────────
 * Alternating section rhythm: light gray → white cards
 * Apple typography: tight line-heights, negative tracking
 * Pill badges, blue CTAs, clean card layout
 */
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

export default function HistoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("draft");

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?status=${activeTab}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-[rgba(0,0,0,0.32)]";
    if (score >= 80) return "text-[#34c759]";
    if (score >= 60) return "text-[#ff9500]";
    return "text-[#ff3b30]";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: "草稿",
      published: "已发布",
      archived: "归档",
    };
    return map[status] ?? status;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ── Page Header ── */}
      <div className="bg-black text-white px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-[40px] font-semibold tracking-[-0.28px] leading-[1.1] text-white"
            style={{ letterSpacing: "-0.28px" }}
          >
            历史文章
          </h1>
          <p
            className="text-[17px] font-normal tracking-[-0.374px] leading-[1.47] text-white/60 mt-2"
          >
            共 {articles.length} 篇文章
          </p>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* 状态筛选 Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList
            variant="default"
            className="gap-1 bg-transparent p-0 mb-6"
          >
            <TabsTrigger
              value="draft"
              className="data-selected:bg-[#1d1d1f] data-selected:text-white data-selected:shadow-none rounded-full"
              style={{
                background: "transparent",
                padding: "6px 18px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1d1d1f",
              }}
            >
              草稿
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className="data-selected:bg-[#1d1d1f] data-selected:text-white data-selected:shadow-none rounded-full"
              style={{
                background: "transparent",
                padding: "6px 18px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1d1d1f",
              }}
            >
              已发布
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-selected:bg-[#1d1d1f] data-selected:text-white data-selected:shadow-none rounded-full"
              style={{
                background: "transparent",
                padding: "6px 18px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1d1d1f",
              }}
            >
              归档
            </TabsTrigger>
          </TabsList>

          {/* CTA */}
          <div className="flex items-center justify-between mb-6">
            <p
              className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]"
            >
              {articles.length === 0
                ? "暂无文章"
                : `${articles.length} 篇`}
            </p>
            <Link href="/write">
              <Button
                variant="pill-filled"
                size="pill-sm"
                className="gap-2"
              >
                <PenLine className="h-3.5 w-3.5" />
                写新文章
              </Button>
            </Link>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[rgba(0,0,0,0.32)]" />
              </div>
            )}

            {/* Empty State */}
            {!loading && articles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <FileText className="h-8 w-8 text-[rgba(0,0,0,0.12)]" />
                </div>
                <div className="text-center">
                  <p
                    className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]"
                  >
                    暂无{getStatusLabel(activeTab)}文章
                  </p>
                  <p
                    className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1"
                  >
                    开始写作后，文章会出现在这里
                  </p>
                </div>
                <Link href="/write">
                  <Button variant="pill-outline" size="pill-sm">
                    去写作
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Article List */}
            {!loading && articles.length > 0 && (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Card
                    key={article.id}
                    className="hover:bg-[#ededed] dark:hover:bg-[#272729] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* 标题区 */}
                        <div className="flex-1 min-w-0">
                          {/* Tags row */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge
                              variant={
                                article.status === "published"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[11px]"
                            >
                              {getStatusLabel(article.status)}
                            </Badge>
                            {article.seoTags?.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[11px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Title */}
                          <h3
                            className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.3] text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors"
                          >
                            {article.title}
                          </h3>

                          {/* Metrics row */}
                          <div className="flex items-center gap-5 mt-3 flex-wrap">
                            {article.wordCount && (
                              <div className="flex items-center gap-1.5 text-[13px] text-[rgba(0,0,0,0.48)] dark:text-white/48 tracking-[-0.224px]">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{article.wordCount.toLocaleString()} 字</span>
                              </div>
                            )}
                            {article.compositeScore && (
                              <div
                                className={`flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.224px] ${getScoreColor(article.compositeScore)}`}
                              >
                                <BarChart2 className="h-3.5 w-3.5" />
                                <span>综合 {article.compositeScore} 分</span>
                              </div>
                            )}
                            {article.humanizerHits > 0 && (
                              <div className="flex items-center gap-1.5 text-[13px] text-[#ff9500] tracking-[-0.224px]">
                                <Shield className="h-3.5 w-3.5" />
                                <span>{article.humanizerHits} 项待优化</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[13px] text-[rgba(0,0,0,0.32)] dark:text-white/32 tracking-[-0.224px] ml-auto">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDate(article.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Link href="/write">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full text-[rgba(0,0,0,0.48)] dark:text-white/48 hover:text-[#0071e3] hover:bg-[#0071e3]/5"
                            >
                              <PenLine className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-[rgba(0,0,0,0.32)] hover:text-[#ff3b30] hover:bg-[#ff3b30]/5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
