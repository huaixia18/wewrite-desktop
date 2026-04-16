"use client";

import { cn } from "@/lib/utils";

interface FeatureGateProps {
  children: React.ReactNode;
  feature?: "coverImage" | "seoDeep" | "wechatPublish" | "bulkGenerate" | "analytics";
  className?: string;
}

export function FeatureGate({ children, className }: FeatureGateProps) {
  // 平台托管模式下先保持透传，后续接入真实订阅检查再启用门控
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  );
}
