"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/* ─── Apple Input ────────────────────────────────────────────────────── */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "h-10 w-full min-w-0 rounded-[11px] border border-black/[0.08] dark:border-white/12",
        "bg-white dark:bg-white/5",
        "px-4 py-[9px]",
        // Typography — Apple body
        "text-[17px] font-normal leading-[1.1] tracking-[-0.374px] text-[#1d1d1f] dark:text-white",
        // Placeholder
        "placeholder:text-[rgba(0,0,0,0.48)] dark:placeholder:text-white/48",
        // Ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Error
        "aria-invalid:border-[#ff3b30] aria-invalid:ring-[#ff3b30]/20",
        "dark:aria-invalid:border-[#ff453a] dark:aria-invalid:ring-[#ff453a]/20",
        className
      )}
      {...props}
    />
  )
}

/* ─── Apple Textarea ─────────────────────────────────────────────────── */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-[11px] border border-black/[0.08] dark:border-white/12",
        "bg-white dark:bg-white/5",
        "px-4 py-[9px]",
        "text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] dark:text-white",
        "placeholder:text-[rgba(0,0,0,0.48)] dark:placeholder:text-white/48",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
