import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          // Size
          size === "sm" && "px-3 py-1.5 text-xs rounded-[var(--radius-micro)]",
          size === "md" && "px-4 py-2 text-sm rounded-[var(--radius-sm)]",
          size === "lg" && "px-6 py-3 text-base rounded-[var(--radius-pill)]",
          // Variant
          variant === "primary" &&
            "bg-[var(--color-apple-blue)] text-white hover:bg-blue-600 active:bg-blue-700",
          variant === "secondary" &&
            "bg-[var(--color-btn-light)] text-[var(--color-near-black)] border border-gray-200 hover:bg-[var(--color-btn-active)]",
          variant === "ghost" &&
            "bg-transparent text-[var(--color-near-black)] hover:bg-black/5",
          variant === "danger" &&
            "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
