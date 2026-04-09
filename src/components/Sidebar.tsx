import { NavLink } from "react-router-dom";
import { Workflow, History, BookOpen, Settings } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: Workflow, label: "写作流程" },
  { to: "/history", icon: History, label: "历史文章" },
  { to: "/exemplars", icon: BookOpen, label: "范文库" },
  { to: "/settings", icon: Settings, label: "设置" },
];

export function Sidebar() {
  return (
    <aside
      className="flex flex-col items-center py-4 flex-shrink-0"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div className="mb-6 mt-1 flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-apple-blue)]">
        <span className="text-white font-bold text-sm select-none">W</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              )
            }
            title={label}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "var(--sidebar-active-border)" }}
                  />
                )}
                <Icon
                  size={18}
                  className={cn(
                    "transition-colors duration-150",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] leading-tight tracking-wide transition-colors duration-150",
                    isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
