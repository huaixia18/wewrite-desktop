import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-[20px] bg-white text-[#1d1d1f]",
        "shadow-[rgba(0,0,0,0.14)_0_18px_36px_-28px]",
        "dark:bg-[#1d1d1f] dark:text-white",
        size === "default" ? "gap-4 py-5 px-6" : "gap-3 py-4 px-4",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 rounded-t-xl",
        size === "sm" ? "px-4" : "px-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-[21px] font-bold leading-[1.19] tracking-[0.231px] text-[#1d1d1f] dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-[14px] font-normal leading-[1.29] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] dark:text-white/80",
        size === "sm" ? "px-4" : "px-6",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-auto flex items-center rounded-b-[20px] border-t border-black/[0.06] bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]",
        size === "sm" ? "p-4" : "p-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
