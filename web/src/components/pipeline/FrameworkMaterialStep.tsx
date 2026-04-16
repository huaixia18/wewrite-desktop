"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { cn } from "@/lib/utils";
import { FrameworkStep } from "@/components/pipeline/FrameworkStep";
import { EnhanceStep } from "@/components/pipeline/EnhanceStep";

type FrameworkMaterialPhase = "framework" | "materials";

export function FrameworkMaterialStep() {
  const { selectedFramework, selectedStrategy, runMode } = usePipelineStore();
  const [manualPhase, setManualPhase] = useState<FrameworkMaterialPhase | null>(null);
  const derivedPhase: FrameworkMaterialPhase =
    runMode === "auto" && selectedFramework && selectedStrategy
      ? "materials"
      : "framework";
  const phase =
    (manualPhase ?? derivedPhase) === "materials" && (!selectedFramework || !selectedStrategy)
      ? "framework"
      : (manualPhase ?? derivedPhase);

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualPhase("framework")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[-0.224px] transition-colors",
              phase === "framework"
                ? "bg-[#0071e3] text-white"
                : "bg-white text-slate-500"
            )}
          >
            1. 结构框架
          </button>
          <button
            onClick={() => {
              if (!selectedFramework || !selectedStrategy) return;
              setManualPhase("materials");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[-0.224px] transition-colors",
              phase === "materials"
                ? "bg-[#0071e3] text-white"
                : selectedFramework && selectedStrategy
                  ? "bg-blue-50 text-blue-600"
                  : "bg-white text-slate-400"
            )}
          >
            2. 素材增强
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-58px)] overflow-y-auto">
        {phase === "framework" ? (
          <FrameworkStep
            disableAutoComplete
            onComplete={() => setManualPhase("materials")}
          />
        ) : (
          <EnhanceStep />
        )}
      </div>
    </div>
  );
}
