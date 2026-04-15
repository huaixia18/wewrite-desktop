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
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/86 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.36)]">Workspace</p>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="truncate text-[18px] font-semibold tracking-[-0.24px] text-[#111827]">{label}</h1>
            <Badge variant="soft" className="bg-[#2563eb]/10 text-[#2563eb]">控制台</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="h-9 gap-2 border-black/[0.08]">
              <CreditCard className="h-4 w-4" />
              订阅
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-9 gap-2 border-black/[0.08]">
              <Settings className="h-4 w-4" />
              设置
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="h-9 w-9 border-black/[0.08]">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
