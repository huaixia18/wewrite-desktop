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
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/write", icon: PenLine, label: "写作", color: "text-blue-500" },
  { href: "/history", icon: History, label: "历史", color: "text-orange-500" },
  { href: "/exemplars", icon: BookOpen, label: "范文", color: "text-green-500" },
  { href: "/themes", icon: Palette, label: "主题", color: "text-purple-500" },
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
    color,
  }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; color?: string }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Tooltip>
        <TooltipTrigger>
          <Link
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200",
              "text-[11px] font-medium leading-none",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", color && active && color)} />
            <span>{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">WeWrite</span>
      </div>

      <Separator />

      {/* Main nav */}
      <div className="flex-1 flex flex-col gap-1 px-2 py-3">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>

      <Separator />

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 px-2 py-3">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} {...item} label={item.label} color={undefined} />
        ))}

        {/* User avatar + logout */}
        <div className="mt-2 flex items-center gap-2 px-2">
          <Avatar className="h-7 w-7 cursor-pointer">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[10px]">
              {session?.user?.name?.[0] ?? "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate">
              {session?.user?.name ?? "未登录"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-md bg-background/80 backdrop-blur border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[72px] flex-col border-r bg-sidebar shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 w-[200px] h-full bg-sidebar border-r shadow-xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
