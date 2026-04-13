"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  BarChart2,
  Trash2,
  PenLine,
  Loader2,
  Sparkles,
  Shield,
} from "lucide-react";

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
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">历史文章</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            已生成 {articles.length} 篇文章
          </p>
        </div>
        <Button className="gap-1.5 bg-blue-500 hover:bg-blue-600">
          <Link href="/write" className="flex items-center gap-1.5">
            <PenLine className="h-4 w-4" />
            写新文章
          </Link>
        </Button>
      </div>

      {/* 状态筛选 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="draft" className="gap-1.5 text-[12px]">
            <FileText className="h-3.5 w-3.5" />
            草稿
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-1.5 text-[12px]">
            <Sparkles className="h-3.5 w-3.5" />
            已发布
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-1.5 text-[12px]">
            归档
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && articles.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText className="h-10 w-10 text-muted-foreground/20" />
                <div className="text-center">
                  <p className="text-[14px] font-medium">暂无{activeTab === "draft" ? "草稿" : activeTab === "published" ? "已发布" : "归档"}文章</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    开始写作后，文章会出现在这里
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Link href="/write">去写作</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && articles.length > 0 && (
            <div className="space-y-3">
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 标题区 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={article.status === "published" ? "default" : "secondary"} className="text-[10px]">
                            {article.status === "draft" ? "草稿" : article.status === "published" ? "已发布" : "归档"}
                          </Badge>
                          {article.seoTags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <h3 className="text-[15px] font-semibold mt-1.5 leading-snug">
                          {article.title}
                        </h3>

                        {/* 指标 */}
                        <div className="flex items-center gap-4 mt-2">
                          {article.wordCount && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {article.wordCount} 字
                            </div>
                          )}
                          {article.compositeScore && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <BarChart2 className="h-3 w-3" />
                              <span className={getScoreColor(article.compositeScore)}>
                                {article.compositeScore} 分
                              </span>
                            </div>
                          )}
                          {article.humanizerHits > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600">
                              <Shield className="h-3 w-3" />
                              {article.humanizerHits} 项待优化
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatDate(article.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* 操作 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="继续编辑"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
