import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-[13px] font-medium text-[var(--color-near-black)] leading-tight"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "px-3 py-2 text-sm text-[var(--color-near-black)] bg-white",
            "border border-gray-200 rounded-[var(--radius-input)]",
            "outline-none transition-all duration-150",
            "focus:border-[var(--color-apple-blue)] focus:ring-2 focus:ring-blue-100",
            "placeholder:text-gray-400",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {hint && (
          <p className="text-[12px] text-[var(--color-text-tertiary)] leading-tight">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
