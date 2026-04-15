"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/http";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import { toast } from "sonner";
import {
  ChevronRight,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

/* ─── Apple Step: Enhance ──────────────────────────────────────────────── */
export function EnhanceStep() {
  const {
    selectedTopic,
    selectedFramework,
    selectedStrategy,
    materials,
    setMaterials,
    nextStep,
    setProgressText,
    markStepDone,
    runMode,
    setRuntime,
  } = usePipelineStore();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const autoRanRef = useRef(false);

  const fetchMaterials = useCallback(async () => {
    if (!selectedTopic?.keywords?.length) return;
    setError("");
    setLoading(true);
    setProgressText("正在采集素材...");
    try {
      const data = await fetchJson<{
        materials: Array<{ title: string; source: string; url: string }>;
        meta?: { mode?: "live" | "mock" };
      }>("/api/topics/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: selectedTopic.keywords }),
      });
      setMaterials(data.materials ?? []);
      setRuntime({ materialsMode: data.meta?.mode ?? "unknown" });
      setProgressText(`采集了 ${data.materials?.length ?? 0} 条素材`);
      if (data.meta?.mode === "mock") {
        toast.info("当前素材采集为 Mock 数据，可先用于流程验证。");
      }
    } catch {
      setError("素材采集失败，请稍后重试。");
      setProgressText("素材采集失败");
      toast.error("素材采集失败，请稍后重试");
    } finally {
      setLoading(false);
      markStepDone();
    }
  }, [markStepDone, selectedTopic?.keywords, setMaterials, setProgressText, setRuntime]);

  // Auto-fetch materials in auto mode when entering this step
  useEffect(() => {
    if (runMode === "auto" && selectedTopic?.keywords?.length && !autoRanRef.current) {
      autoRanRef.current = true;
      void fetchMaterials();
    }
  }, [fetchMaterials, runMode, selectedTopic?.keywords]);

  const addManualMaterial = () => {
    if (!query.trim()) return;
    setMaterials([...materials, { title: query, source: "手动添加", url: "" }]);
    setQuery("");
  };

  return (
    <div className="max-w-[880px] mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-semibold tracking-[0.196px] leading-[1.14] text-[#1d1d1f]">
          内容增强
        </h2>
        <p className="text-[14px] font-normal tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
          采集真实素材，让文章有料可依，拒绝 AI 空话
        </p>
      </div>

      {/* Topic summary */}
      {error && (
        <StepStatusAlert
          variant="error"
          title="素材采集失败"
          description={error}
          actionLabel="重试采集"
          onAction={() => void fetchMaterials()}
        />
      )}

      <div className="bg-white rounded-2xl p-5 ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px] font-medium tracking-[-0.12px] bg-[#0071e3]/10 text-[#0071e3] border-0">
            {selectedFramework}
          </Badge>
          <Badge variant="outline" className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0">
            {selectedStrategy}
          </Badge>
          {selectedTopic?.keywords?.slice(0, 4).map((kw) => (
            <Badge key={kw} variant="outline" className="text-[11px] font-medium tracking-[-0.12px] bg-[#f5f5f7] text-[rgba(0,0,0,0.48)] border-0">
              {kw}
            </Badge>
          ))}
        </div>
        <p className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.3] mt-3 text-[#1d1d1f]">
          {selectedTopic?.title}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-3 border border-black/[0.08] rounded-[11px] px-4 py-[9px] bg-white">
          <Search className="h-4 w-4 text-[rgba(0,0,0,0.24)] shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[17px]"
            style={{ fontSize: "17px", letterSpacing: "-0.374px", color: "#1d1d1f" }}
            placeholder="手动添加素材关键词或标题..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManualMaterial()}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addManualMaterial}
          className="h-[42px] gap-1.5 text-[14px] border-[rgba(0,0,0,0.08)] shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          添加
        </Button>
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="h-[42px] gap-1.5 text-[14px] shrink-0"
          onClick={fetchMaterials}
          disabled={loading || !selectedTopic?.keywords?.length}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          采集素材
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-white/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* Material list */}
      {!loading && materials.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] text-[rgba(0,0,0,0.32)] tracking-[-0.12px] font-medium">
            已采集 {materials.length} 条素材
          </p>
          {materials.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 ring-1 ring-black/[0.06] hover:shadow-[rgba(0,0,0,0.06)_0_2px_8px_0px] transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#34c759] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold tracking-[-0.224px] leading-[1.3] text-[#1d1d1f]">
                    {m.title}
                  </p>
                  <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.32)] mt-1">
                    {m.source}
                  </p>
                </div>
                {m.url && (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[rgba(0,0,0,0.32)] hover:text-[#0071e3] transition-colors p-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <Search className="h-8 w-8 text-[rgba(0,0,0,0.12)]" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              暂无素材
            </p>
            <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] mt-1">
              点击「采集素材」从网络获取真实信息
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <Button
          variant="pill-filled"
          size="pill-sm"
          className="gap-1.5 h-10 px-5"
          onClick={nextStep}
        >
          开始写作
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
