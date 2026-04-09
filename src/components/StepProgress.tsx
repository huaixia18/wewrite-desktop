import { cn } from "../lib/utils";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

interface Step {
  number: number;
  title: string;
  status: StepStatus;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center min-w-0">
          {/* Step item */}
          <button
            onClick={() => onStepClick?.(step.number)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer min-w-[64px]",
              step.number === currentStep
                ? "bg-white shadow-[var(--shadow-card)]"
                : "hover:bg-black/5"
            )}
          >
            {/* Badge */}
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-150",
                step.status === "done" && "bg-green-500 text-white",
                step.status === "running" && "bg-[var(--color-apple-blue)] text-white",
                step.status === "error" && "bg-red-500 text-white",
                step.status === "pending" && step.number === currentStep && "bg-[var(--color-apple-blue)] text-white",
                step.status === "pending" && step.number !== currentStep && "bg-gray-200 text-gray-500"
              )}
            >
              {step.status === "done" && <Check size={12} strokeWidth={3} />}
              {step.status === "running" && <Loader2 size={12} className="animate-spin" />}
              {step.status === "error" && <AlertCircle size={12} />}
              {step.status === "pending" && <span>{step.number}</span>}
            </div>
            {/* Title */}
            <span
              className={cn(
                "text-[10px] leading-tight text-center whitespace-nowrap transition-colors duration-150",
                step.number === currentStep
                  ? "text-[var(--color-apple-blue)] font-medium"
                  : step.status === "done"
                  ? "text-green-600"
                  : step.status === "error"
                  ? "text-red-500"
                  : "text-[var(--color-text-secondary)]"
              )}
            >
              {step.title}
            </span>
          </button>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-4 flex-shrink-0 transition-colors duration-150",
                step.status === "done" ? "bg-green-400" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
