"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CreditCard, Settings } from "lucide-react";

const pageLabelMap: Record<string, string> = {
  "/write": "写作中心",
  "/history": "内容库",
  "/settings": "系统设置",
  "/pricing": "账单与订阅",
};

export function WorkspaceTopbar() {
  const pathname = usePathname();
  const label = pageLabelMap[pathname] ?? "控制台";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between pl-14 pr-4 sm:h-[58px] sm:px-6 lg:px-7">
        <div className="min-w-0">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">
            Workspace
          </p>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[16px] font-semibold tracking-[-0.28px] text-slate-900 sm:text-[18px]">
              {label}
            </h1>
            <Badge
              variant="soft"
              className="hidden border-0 bg-blue-50 text-[11px] font-medium text-blue-600 sm:inline-flex"
            >
              控制台
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-slate-200 px-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:h-8 sm:px-3"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span className="hidden text-[13px] sm:inline">订阅</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-slate-200 px-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:h-8 sm:px-3"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden text-[13px] sm:inline">设置</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
