"use client";

import { LuBan, LuCheck } from "react-icons/lu";
import { HEX_RE, linkCss, THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const GRADIENT_PRESETS: Array<{ name: string; from: string; to: string }> = [
  { name: "Sunset", from: "#ff9a56", to: "#ff4d79" },
  { name: "Ocean", from: "#22d3ee", to: "#2563eb" },
  { name: "Aurora", from: "#a78bfa", to: "#f472b6" },
  { name: "Mint", from: "#34d399", to: "#059669" },
  { name: "Berry", from: "#db2777", to: "#7c3aed" },
  { name: "Gold", from: "#fbbf24", to: "#f97316" },
  { name: "Rose", from: "#fb7185", to: "#e11d48" },
  { name: "Midnight", from: "#1e1b4b", to: "#6366f1" },
  { name: "Lime", from: "#a3e635", to: "#16a34a" },
  { name: "Peach", from: "#fed7aa", to: "#fda4af" },
  { name: "Sky", from: "#bae6fd", to: "#c4b5fd" },
  { name: "Slate", from: "#475569", to: "#0f172a" },
];

const fill = (from: string, to: string) => `linear-gradient(135deg, ${from}, ${to})`;

export default function GradientPicker({
  from,
  to,
  onChange,
  label = "Card colour",
  hint,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
  hint?: string;
}) {
  const custom = HEX_RE.test(from);
  const a = custom ? from : "#7c3aed";
  const b = HEX_RE.test(to) ? to : custom ? from : "#db2777";

  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        {custom && (
          <button type="button" onClick={() => onChange("", "")} className="text-xs font-bold text-violet-600 hover:underline">
            Reset
          </button>
        )}
      </div>
      {hint && <p className="mb-2.5 text-xs text-zinc-500">{hint}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("", "")}
          aria-label="Use theme default"
          title="Theme default"
          className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-zinc-400 transition hover:scale-105", !custom ? "border-violet-500 text-violet-600" : "border-zinc-200")}
        >
          <LuBan className="h-4 w-4" />
        </button>
        {GRADIENT_PRESETS.map((g) => {
          const active = custom && from.toLowerCase() === g.from && to.toLowerCase() === g.to;
          return (
            <button
              key={g.name}
              type="button"
              title={g.name}
              aria-label={g.name}
              aria-pressed={active}
              onClick={() => onChange(g.from, g.to)}
              className={cn("relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-zinc-50 transition hover:scale-110", active ? "ring-violet-500" : "ring-transparent")}
              style={{ background: fill(g.from, g.to) }}
            >
              {active && <LuCheck className="h-4 w-4 text-white drop-shadow" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {(
          [
            ["From", a, (v: string) => onChange(v, b)],
            ["To", b, (v: string) => onChange(a, v)],
          ] as const
        ).map(([name, value, set]) => (
          <label key={name} className="flex items-center gap-2.5 rounded-xl bg-white p-2 text-xs font-bold text-zinc-500 ring-1 ring-zinc-200">
            <input type="color" value={value} onChange={(e) => set(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0" />
            <span>
              {name}
              <span className="block font-mono text-[10px] font-semibold uppercase text-zinc-400">{value}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex h-12 items-center justify-center text-sm font-bold" style={custom ? linkCss(THEMES[0], "solid", "pill", from, to) : { borderRadius: 9999, background: "#e4e4e7", color: "#71717a" }}>
        {custom ? "Sample link card" : "Using the theme's button style"}
      </div>
    </div>
  );
}
