"use client";

import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Variant = "error" | "warning" | "info" | "success";

const styles: Record<
  Variant,
  { wrap: string; title: string; Icon: ComponentType<{ className?: string }> }
> = {
  error: {
    wrap: "bg-[#ff3b30]/8 border border-[#ff3b30]/20",
    title: "text-[#b42318]",
    Icon: AlertTriangle,
  },
  warning: {
    wrap: "bg-[#ff9500]/10 border border-[#ff9500]/20",
    title: "text-[#b54708]",
    Icon: AlertTriangle,
  },
  info: {
    wrap: "bg-[#0071e3]/8 border border-[#0071e3]/16",
    title: "text-[#005bb5]",
    Icon: Info,
  },
  success: {
    wrap: "bg-[#34c759]/10 border border-[#34c759]/20",
    title: "text-[#067647]",
    Icon: CheckCircle2,
  },
};

export function StepStatusAlert({
  title,
  description,
  variant = "info",
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  variant?: Variant;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const config = styles[variant];
  const Icon = config.Icon;

  return (
    <div className={cn("rounded-2xl p-4", config.wrap)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.title)} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[14px] font-semibold tracking-[-0.224px]", config.title)}>
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-[13px] leading-[1.45] tracking-[-0.224px] text-[rgba(0,0,0,0.56)]">
              {description}
            </p>
          ) : null}
          {actionLabel && onAction && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 border-black/[0.08] bg-white text-[13px]"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
