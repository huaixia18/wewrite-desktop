"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

/* ─── Apple Switch ──────────────────────────────────────────────────── */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Track colors
        "data-unchecked:bg-[rgba(0,0,0,0.1)] dark:data-unchecked:bg-white/20",
        "data-checked:bg-[#0071e3]",
        // Sizes
        "h-[28px] w-[51px] data-[size=sm]:h-[22px] data-[size=sm]:w-[40px]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
          "transition-transform duration-200 ease-out",
          // Default size
          "size-[22px] translate-x-[3px]",
          "data-checked:translate-x-[26px]",
          // Sm size
          "data-[size=sm]:size-[18px] data-[size=sm]:translate-x-[2px] data-[size=sm]:data-checked:translate-x-[20px]",
          className
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
