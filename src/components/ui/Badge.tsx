import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "blue" | "green" | "yellow" | "red" | "gray";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-[var(--color-apple-blue)]",
  green: "bg-green-50 text-green-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  gray: "bg-gray-50 text-gray-500",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[var(--radius-micro)] text-[11px] font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
