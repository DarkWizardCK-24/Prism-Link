"use client";

import { LuLoaderCircle } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand animate-shimmer text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:brightness-110",
  secondary: "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
  ghost: "text-zinc-600 hover:bg-zinc-100",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export default function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && <LuLoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
