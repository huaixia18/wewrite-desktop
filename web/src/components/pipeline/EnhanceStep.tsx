"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

export function EnhanceStep() {
  const {
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    materials,
    setMaterials,
    nextStep,
    setProgressText,
  } = usePipelineStore();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const fetchMaterials = async () => {
    if (!selectedTopic?.keywords?.length) return;
    setLoading(true);
    setProgressText("正在采集素材...");
    try {
      const res = await fetch("/api/topics/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedTopic.keywords }),
      });
      const data = await res.json();
      setMaterials(data.materials ?? []);
      setProgressText(`采集了 ${data.materials?.length ?? 0} 条素材`);
    } catch {
      setProgressText("素材采集失败");
    } finally {
      setLoading(false);
    }
  };

  const addManualMaterial = () => {
    if (!query.trim()) return;
    setMaterials([...materials, { title: query, source: "手动添加", url: "" }]);
    setQuery("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">内容增强</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          通过 WebSearch 采集真实素材，让文章有料可依，拒绝 AI 空话
        </p>
      </div>

      {/* 当前选题摘要 */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{selectedFramework}</Badge>
            <Badge>{selectedStrategy}</Badge>
            {selectedTopic?.keywords?.slice(0, 4).map((kw) => (
              <Badge key={kw} variant="secondary" className="text-[11px]">
                {kw}
              </Badge>
            ))}
          </div>
          <p className="text-[13px] mt-2 font-medium">{selectedTopic?.title}</p>
        </CardContent>
      </Card>

      {/* 手动添加 */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-background">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[13px]"
            placeholder="手动添加素材关键词或标题..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManualMaterial()}
          />
        </div>
        <Button variant="outline" size="sm" onClick={addManualMaterial} className="gap-1.5">
          <PlusCircle className="h-3.5 w-3.5" />
          添加
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          onClick={fetchMaterials}
          disabled={loading || !selectedTopic?.keywords?.length}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          采集素材
        </Button>
      </div>

      {/* 素材列表 */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      )}

      {!loading && materials.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] text-muted-foreground font-medium">
            已采集 {materials.length} 条素材
          </div>
          {materials.map((m, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.source}</p>
                  </div>
                  {m.url && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && materials.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">
              点击「采集素材」从网络获取真实信息
            </p>
          </CardContent>
        </Card>
      )}

      {/* 下一步 */}
      <div className="flex justify-end pt-2">
        <Button
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          onClick={nextStep}
        >
          开始写作
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
