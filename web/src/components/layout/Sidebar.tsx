"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!mobileOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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
          "group relative block w-full rounded-xl px-3 py-2.5 transition-all duration-150",
          "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          active
            ? "bg-violet-50 text-violet-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-500" />
        )}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-violet-100 text-violet-600"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium tracking-[-0.1px]">{label}</p>
            <p
              className={cn(
                "mt-0.5 text-[11px] leading-[1.3] tracking-[-0.05px]",
                active ? "text-violet-500" : "text-slate-400"
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col px-3 pb-4 pt-4">
      {/* Logo */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.35)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
              WeWrite Cloud
            </p>
            <p className="text-[15px] font-semibold tracking-[-0.2px] text-slate-900">
              内容控制台
            </p>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <div className="mt-5">
        <p className="px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
          Workspace
        </p>
        <nav className="mt-1.5 space-y-0.5">
          {primaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {/* Secondary nav */}
      <div className="mt-5">
        <p className="px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
          System
        </p>
        <nav className="mt-1.5 space-y-0.5">
          {secondaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto space-y-3 pt-4">
        {/* Pro card */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-700/30 bg-[linear-gradient(160deg,#6d28d9_0%,#4f46e5_58%,#312e81_100%)] px-3.5 py-3.5 shadow-[0_12px_26px_-16px_rgba(49,46,129,0.85)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <p className="relative inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
            <Sparkles className="h-3 w-3" />
            Pro 能力
          </p>
          <p className="relative mt-2 text-[14px] font-semibold tracking-[-0.12px] text-white">
            发布、SEO、配图一体化
          </p>
          <p className="relative mt-1 text-[11px] text-violet-100/95">
            解锁完整自动化发布链路
          </p>
          <Link href="/pricing" className="mt-3 flex">
            <Button
              variant="pill-filled"
              size="pill-sm"
              className="h-8 w-full bg-white px-3 text-[12px] font-semibold text-violet-700 hover:bg-violet-50"
            >
              查看套餐
            </Button>
          </Link>
        </div>

        {/* User card */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-3.5 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" className="shrink-0">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-[12px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold tracking-[-0.1px] text-slate-900">
                {session?.user?.name ?? "未登录用户"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {session?.user?.email ?? "使用邮箱登录"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-3 h-8 w-full justify-center gap-1.5 border-slate-300 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-3.5 w-3.5" />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={cn(
          "fixed left-4 top-4 z-[70] rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm",
          "lg:hidden"
        )}
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "关闭导航" : "打开导航"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[248px] shrink-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-sm lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[54] bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-[55] flex w-[min(88vw,320px)] flex-col overflow-y-auto border-r border-slate-200/80 bg-white lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
