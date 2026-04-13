import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ─── Apple Button Variants ─────────────────────────────────────────── */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary CTA — Apple Blue */
        default:
          "bg-[#0071e3] text-white hover:bg-[#0062b0] active:bg-[#005a9e] rounded-lg text-[17px] font-normal px-[15px] py-[8px] leading-[1] tracking-[normal]",
        /* Secondary Dark */
        secondary:
          "bg-[#1d1d1f] text-white hover:bg-[#2d2d2f] active:bg-[#3d3d3f] rounded-lg text-[17px] font-normal px-[15px] py-[8px]",
        /* Ghost — subtle hover */
        ghost:
          "text-[#1d1d1f] hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-white dark:hover:bg-white/[0.08]",
        /* Link */
        link:
          "text-[#0066cc] underline-offset-4 hover:underline dark:text-[#2997ff]",
        /* Destructive */
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#d92b20] rounded-lg",
        /* Apple Pill Outline */
        "pill-outline":
          "bg-transparent border border-[#0071e3] text-[#0071e3] hover:text-[#005a9e] hover:border-[#005a9e] rounded-[980px] text-[14px] px-5 py-[8px]",
        /* Apple Pill Filled */
        "pill-filled":
          "bg-[#0071e3] text-white hover:bg-[#0062b0] rounded-[980px] text-[14px] px-5 py-[8px]",
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
