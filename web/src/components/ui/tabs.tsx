"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ─── Apple Tabs Root ───────────────────────────────────────────────── */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2", className)}
      {...props}
    />
  )
}

/* ─── Apple Tabs List ───────────────────────────────────────────────── */
const tabsListVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-[11px] p-[3px]",
  {
    variants: {
      variant: {
        /* Pill background — default Apple style */
        default: "bg-black/[0.04] dark:bg-white/[0.06]",
        /* Transparent underline style */
        line:
          "bg-transparent gap-0 p-0 rounded-none",
        /* Ghost — minimal */
        ghost: "bg-transparent p-0 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        tabsListVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

/* ─── Apple Tab Trigger ──────────────────────────────────────────────── */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        // Typography — Apple body emphasis
        "text-[14px] font-semibold tracking-[-0.224px] leading-[1.1]",
        // Padding
        "px-[14px] py-[6px]",
        // Transition
        "transition-all duration-200 ease-out",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Default: muted
        "text-[rgba(0,0,0,0.48)] dark:text-white/48",
        // Hover: shift toward foreground
        "hover:text-[rgba(0,0,0,0.8)] dark:hover:text-white/80",
        // Active/selected: white on pill bg, blue on line
        "data-selected:bg-white dark:data-selected:bg-white/10",
        "data-selected:text-[#1d1d1f] dark:data-selected:text-white",
        // Line variant: underline style
        "group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-selected:text-[#0071e3] dark:group-data-[variant=line]/tabs-list:data-selected:text-[#0071e3]",
        "group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:data-selected:border-[#0071e3] group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-[14px]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/* ─── Apple Tab Content ─────────────────────────────────────────────── */
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-[17px] leading-[1.47] tracking-[-0.374px] outline-none",
        "mt-3",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
