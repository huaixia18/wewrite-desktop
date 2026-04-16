"use client";

import { useMemo, useState } from "react";
import { usePipelineStore } from "@/store/pipeline";
import { cn } from "@/lib/utils";
import { HotspotStep } from "@/components/pipeline/HotspotStep";
import { TopicStep } from "@/components/pipeline/TopicStep";

type TopicPlanningPhase = "hotspot" | "topic";

export function TopicPlanningStep() {
  const { selectedHotspots, topics } = usePipelineStore();
  const [manualPhase, setManualPhase] = useState<TopicPlanningPhase | null>(null);
  const derivedPhase: TopicPlanningPhase = topics.length > 0 ? "topic" : "hotspot";
  const phase =
    (manualPhase ?? derivedPhase) === "topic" && selectedHotspots.length === 0
      ? "hotspot"
      : (manualPhase ?? derivedPhase);

  const phaseItems = useMemo(
    () => [
      { key: "hotspot" as const, label: "热点筛选", done: selectedHotspots.length > 0 },
      { key: "topic" as const, label: "选题决策", done: topics.length > 0 },
    ],
    [selectedHotspots.length, topics.length]
  );

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-2">
          {phaseItems.map((item, index) => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === "topic" && selectedHotspots.length === 0) return;
                setManualPhase(item.key);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[-0.224px] transition-colors",
                phase === item.key
                  ? "bg-[#0071e3] text-white"
                  : item.done
                    ? "bg-blue-50 text-blue-600"
                    : "bg-white text-slate-500"
              )}
            >
              {index + 1}. {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[calc(100%-58px)] overflow-y-auto">
        {phase === "hotspot" ? (
          <HotspotStep expectedStep={2} onProceed={() => setManualPhase("topic")} />
        ) : (
          <TopicStep onBackToHotspots={() => setManualPhase("hotspot")} />
        )}
      </div>
    </div>
  );
}
