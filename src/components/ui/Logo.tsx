import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // Unique ids: duplicate ids break when one copy sits inside a display:none container.
  const uid = useId().replace(/:/g, "");
  const bg = `pl-bg-${uid}`;
  const hi = `pl-hi-${uid}`;
  const rod = `pl-rod-${uid}`;
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9 drop-shadow-sm", className)} aria-hidden>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset=".5" stopColor="#e11d48" />
          <stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <radialGradient id={hi} cx=".25" cy=".1" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={rod} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity=".55" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${bg})`} />
      <rect width="64" height="64" rx="16" fill={`url(#${hi})`} />
      <path d="M32 12 51 46H13Z" fill="#fff" fillOpacity=".14" />
      <path d="M32 12 51 46H13Z" fill="none" stroke={`url(#${rod})`} strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M32 22.5 42.5 41.5H21.5Z" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 37 20.8 32" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M45.4 36 59 29" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M45.4 36 60 36.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M45.4 36 59 44" stroke="#fda4af" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("font-display text-xl font-extrabold tracking-tight", light ? "text-white" : "text-[#1a1530]")}>
        prism<span className={light ? "text-white/80" : "text-gradient"}>link</span>
      </span>
    </Link>
  );
}
