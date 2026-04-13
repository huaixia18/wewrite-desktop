"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

/* ─── Apple Slider ──────────────────────────────────────────────────── */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none items-center select-none", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50">
        {/* Track */}
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full",
            "h-[3px] w-full",
            "bg-black/[0.08] dark:bg-white/12"
          )}
        >
          {/* Active range */}
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute inset-y-0 left-0 rounded-full bg-[#0071e3]"
          />
        </SliderPrimitive.Track>

        {/* Thumb(s) */}
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "relative block size-[18px] shrink-0 rounded-full",
              "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]",
              "outline-none",
              "hover:ring-2 hover:ring-[#0071e3]/30 hover:ring-offset-1",
              "focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2",
              "active:ring-2 active:ring-[#0071e3]/30 active:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
