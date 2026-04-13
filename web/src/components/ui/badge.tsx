import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ─── Apple Badge Variants ───────────────────────────────────────────── */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3!",
  {
    variants: {
      variant: {
        /* Apple Blue pill — primary tag */
        default:
          "bg-[#0071e3] text-white rounded-[980px] px-[10px] py-[3px] text-[12px] font-medium tracking-[-0.12px]",
        /* Dark tag */
        secondary:
          "bg-[#1d1d1f] text-white rounded-[980px] px-[10px] py-[3px] text-[12px] font-medium tracking-[-0.12px]",
        /* Destructive */
        destructive:
          "bg-[#ff3b30] text-white rounded-[980px] px-[10px] py-[3px] text-[12px] font-medium tracking-[-0.12px]",
        /* Ghost outline */
        outline:
          "border border-[rgba(0,0,0,0.12)] dark:border-white/12 text-[#1d1d1f] dark:text-white rounded-[980px] px-[10px] py-[3px] text-[12px] font-medium tracking-[-0.12px]",
        /* Ghost subtle */
        ghost:
          "text-[rgba(0,0,0,0.48)] dark:text-white/48 hover:text-[#1d1d1f] dark:hover:text-white rounded-[5px] px-2 py-0.5 text-[12px]",
        /* Link blue */
        link:
          "text-[#0066cc] dark:text-[#2997ff] text-[12px] font-medium underline-offset-4 hover:underline",
        /* Soft blue */
        soft:
          "bg-[#0071e3]/10 text-[#0071e3] rounded-[980px] px-[10px] py-[3px] text-[12px] font-medium tracking-[-0.12px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
