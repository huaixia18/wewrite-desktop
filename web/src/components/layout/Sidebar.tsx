"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  PenLine,
  History,
  BookOpen,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

/* ─── Apple Glass Sidebar ──────────────────────────────────────────────
 * Pure black background with glass blur effect
 * backdrop-filter: saturate(180%) blur(20px) on rgba(0,0,0,0.8)
 * Minimal icon + text, Apple-blue active state
 */
const navItems = [
  { href: "/write", icon: PenLine, label: "写作" },
  { href: "/history", icon: History, label: "历史" },
  { href: "/exemplars", icon: BookOpen, label: "范文" },
  { href: "/themes", icon: Palette, label: "主题" },
];

const bottomNavItems = [
  { href: "/settings", icon: Settings, label: "设置" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => {
    const active =
      pathname === href || (href !== "/" && pathname.startsWith(href));

    return (
      <Tooltip>
        <TooltipTrigger>
          <Link
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-[11px] px-3 py-2.5",
              "text-[14px] font-normal tracking-[-0.224px] leading-[1.43]",
              "transition-all duration-200 ease-out",
              "outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-1",
              active
                ? "bg-[#0071e3] text-white"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-white" : "text-white/50 group-hover:text-white"
              )}
            />
            <span className="font-medium">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[#1d1d1f] text-white border-0">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-black">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-[18px] bg-[#0071e3] flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[17px] font-semibold tracking-[-0.374px] leading-[1.1] text-white">
          WeWrite
        </span>
      </div>

      <Separator className="bg-white/[0.08]" />

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2.5 py-4">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <Separator className="bg-white/[0.08]" />

      {/* Bottom nav + user */}
      <div className="flex flex-col gap-0.5 px-2.5 py-4">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* User row */}
        <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-[11px] hover:bg-white/[0.06] transition-all">
          <Avatar size="sm" className="shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[10px] bg-white/10 text-white">
              {session?.user?.name?.[0] ?? "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium tracking-[-0.224px] text-white/80 truncate">
              {session?.user?.name ?? "未登录"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "text-white/30 hover:text-white/60 transition-colors p-1",
              "outline-none focus-visible:ring-1 focus-visible:ring-[#0071e3] rounded-md"
            )}
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={cn(
          "fixed top-3 left-3 z-[60] p-2 rounded-[11px]",
          "bg-black/60 text-white backdrop-blur-xl border border-white/[0.08]",
          "lg:hidden transition-all"
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* ── Desktop Glass Sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0",
          // Apple glass: fixed width, pure black
          "w-[220px] h-screen sticky top-0 shrink-0",
          // Glass border
          "border-r border-white/[0.06]"
        )}
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "fixed top-0 left-0 z-[56] w-[260px] h-full",
              "border-r border-white/[0.08]",
              "lg:hidden",
              "flex flex-col"
            )}
            style={{
              background: "rgba(0,0,0,0.96)",
              backdropFilter: "saturate(180%) blur(20px)",
              WebkitBackdropFilter: "saturate(180%) blur(20px)",
            }}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
