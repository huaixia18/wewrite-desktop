import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  dark?: boolean;
}

export function Card({ className, dark, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] p-5",
        dark
          ? "bg-[var(--color-dark-surface)] text-white"
          : "bg-white",
        !dark && "shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
