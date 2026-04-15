"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CreditCard,
  History,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const primaryNav = [
  {
    href: "/write",
    label: "写作中心",
    description: "从热点到发布",
    icon: PenLine,
  },
  {
    href: "/history",
    label: "内容库",
    description: "草稿、成稿、归档",
    icon: History,
  },
];

const secondaryNav = [
  {
    href: "/settings",
    label: "系统设置",
    description: "AI、风格、账号",
    icon: Settings,
  },
  {
    href: "/pricing",
    label: "账单与订阅",
    description: "套餐与权益",
    icon: CreditCard,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = useMemo(() => {
    const base = session?.user?.name ?? session?.user?.email ?? "WeWrite";
    return base.slice(0, 1).toUpperCase();
  }, [session?.user?.email, session?.user?.name]);

  const NavLink = ({
    href,
    icon: Icon,
    label,
    description,
  }: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    description: string;
  }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative block w-full rounded-2xl px-3 py-3 transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]",
          active
            ? "bg-[#1d4ed8] text-white shadow-[rgba(59,130,246,0.35)_0_12px_30px_-16px]"
            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
        )}
      >
        {active && <span className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[#60a5fa]" />}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              active ? "bg-white/15" : "bg-white/[0.06] group-hover:bg-white/[0.1]"
            )}
          >
            <Icon className={cn("h-[17px] w-[17px]", active ? "text-white" : "text-slate-300")} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium tracking-[-0.18px]">{label}</p>
            <p className={cn("mt-1 text-[12px] leading-[1.35] tracking-[-0.1px]", active ? "text-white/78" : "text-slate-400")}>
              {description}
            </p>
          </div>
        </div>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col px-4 pb-4 pt-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-[rgba(37,99,235,0.45)_0_12px_30px_-18px]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">WeWrite Cloud</p>
            <p className="text-[17px] font-semibold tracking-[-0.25px] text-white">内容控制台</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="px-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">Workspace</p>
        <nav className="mt-2 space-y-1.5">
          {primaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <p className="px-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">System</p>
        <nav className="mt-2 space-y-1.5">
          {secondaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>

      <div className="mt-auto space-y-3 pt-4">
        <div className="rounded-2xl border border-[#2563eb]/30 bg-[#2563eb]/12 p-4">
          <p className="text-[12px] tracking-[-0.12px] text-slate-300">Pro 能力</p>
          <p className="mt-1 text-[14px] font-medium tracking-[-0.2px] text-white">发布、SEO、配图一体化</p>
          <Link href="/pricing" className="mt-3 inline-flex">
            <Button variant="pill-filled" size="pill-sm" className="h-9 px-4 text-[13px]">
              查看套餐
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <Avatar size="sm" className="shrink-0">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="bg-white/[0.08] text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium tracking-[-0.2px] text-white">
                {session?.user?.name ?? "未登录用户"}
              </p>
              <p className="truncate text-[12px] tracking-[-0.1px] text-slate-400">
                {session?.user?.email ?? "使用邮箱登录"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-3 h-10 w-full justify-center gap-2 border-white/12 bg-transparent text-white hover:bg-white/[0.06]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className={cn(
          "fixed left-4 top-4 z-[70] rounded-full border border-white/[0.12] bg-[#0b1020] p-2 text-white shadow-[rgba(0,0,0,0.4)_0_16px_30px_-20px]",
          "lg:hidden"
        )}
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "关闭导航" : "打开导航"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] shrink-0 border-r border-white/[0.06] bg-[#0b1020] lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-[54] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-[55] flex w-[300px] flex-col overflow-y-auto border-r border-white/[0.08] bg-[#0b1020] lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
