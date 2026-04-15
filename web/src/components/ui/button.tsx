import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ─── Apple Button Variants ─────────────────────────────────────────── */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-[#0071e3] px-[15px] py-[8px] text-[17px] font-normal leading-[1] tracking-[normal] text-white hover:bg-[#0062b0] active:bg-[#005a9e]",
        secondary:
          "rounded-lg bg-[#1d1d1f] px-[15px] py-[8px] text-[17px] font-normal text-white hover:bg-[#2a2a2d] active:bg-[#000000]",
        ghost:
          "rounded-lg text-[#1d1d1f] hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-white dark:hover:bg-white/[0.08]",
        link:
          "text-[#0066cc] underline-offset-4 hover:underline dark:text-[#2997ff]",
        destructive:
          "rounded-lg bg-[#ff3b30] text-white hover:bg-[#d92b20]",
        "pill-outline":
          "rounded-[980px] border border-[#0071e3] bg-transparent px-5 py-[8px] text-[14px] text-[#0071e3] hover:border-[#005a9e] hover:text-[#005a9e]",
        "pill-filled":
          "rounded-[980px] bg-[#0071e3] px-5 py-[8px] text-[14px] text-white hover:bg-[#0062b0]",
        outline:
          "rounded-lg border border-black/12 bg-white/80 text-[#1d1d1f] hover:bg-black/[0.03] dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]",
      },
      size: {
        default: "h-10 px-4 gap-2 text-[17px]",
        sm: "h-8 px-3 gap-1.5 text-[14px] rounded-lg",
        lg: "h-12 px-6 gap-2 text-[17px] rounded-lg",
        icon: "h-10 w-10 rounded-full",
        "pill-sm": "h-8 rounded-[980px] text-[12px] px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
