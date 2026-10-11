"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuEye, LuGlobe, LuLoaderCircle, LuMonitor, LuMousePointerClick, LuPercent, LuSmartphone, LuTablet, LuTrophy } from "react-icons/lu";
import type { IconType } from "react-icons";
import { countBy, countryName } from "@/lib/analytics";
import { subscribeEvents } from "@/lib/db";
import { getPlatform } from "@/lib/platforms";
import { dayKey } from "@/lib/time";
import type { AnalyticsEvent, LinkItem, Profile } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

const DAY = 86_400_000;

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value, tint }: { icon: IconType; label: string; value: string; tint: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-zinc-400">{label}</p>
    </motion.div>
  );
}

function BarList({ rows, empty, color = "bg-brand" }: { rows: Array<{ key: string; label: ReactNode; count: number }>; empty: string; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-zinc-400">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold">{r.label}</span>
            <span className="shrink-0 font-bold text-zinc-500">{r.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(r.count / max) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }} className={cn("h-full rounded-full", color)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendChart({ days, views, clicks }: { days: string[]; views: number[]; clicks: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, P = { l: 30, r: 10, t: 12, b: 26 };
  const n = days.length;
  const max = Math.max(4, ...views, ...clicks);
  const x = (i: number) => P.l + (i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const path = (a: number[]) =>
    a.map((v, i) => (i === 0 ? `M${x(0)},${y(v)}` : `C${(x(i - 1) + x(i)) / 2},${y(a[i - 1])} ${(x(i - 1) + x(i)) / 2},${y(v)} ${x(i)},${y(v)}`)).join("");
  const area = (a: number[]) => `${path(a)}L${x(n - 1)},${H - P.b}L${x(0)},${H - P.b}Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const label = (d: string) => new Date(`${d}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        setHover(Math.min(n - 1, Math.max(0, Math.round(((px - P.l) / (W - P.l - P.r)) * (n - 1)))));
      }}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y" role="img" aria-label="Views and clicks over time">
        <defs>
          <linearGradient id="av" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c3aed" stopOpacity=".28" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f43f5e" stopOpacity=".25" />
            <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#e4e4e7" strokeDasharray="3 5" />
            <text x={P.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#a1a1aa" fontWeight="600">
              {t}
            </text>
          </g>
        ))}
        <path d={area(views)} fill="url(#av)" />
        <path d={area(clicks)} fill="url(#ac)" />
        <motion.path d={path(views)} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
        <motion.path d={path(clicks)} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.1 }} />
        {[0, Math.floor((n - 1) / 2), n - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="11" fill="#a1a1aa" fontWeight="600">
            {label(days[i])}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#c4b5fd" strokeWidth="1.5" />
            <circle cx={x(hover)} cy={y(views[hover])} r="5" fill="#7c3aed" stroke="#fff" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(clicks[hover])} r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-2xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-xl" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}>
          <p className="text-zinc-400">{label(days[hover])}</p>
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />{views[hover]} views</p>
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />{clicks[hover]} clicks</p>
        </div>
      )}
    </div>
  );
}

const DEVICE_ICON: Record<string, IconType> = { mobile: LuSmartphone, tablet: LuTablet, desktop: LuMonitor };

export default function AnalyticsPanel({ profile, links }: { profile: Profile; links: LinkItem[] }) {
  const [range, setRange] = useState<7 | 30>(7);
  const [events, setEvents] = useState<AnalyticsEvent[] | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - (range - 1) * DAY).setHours(0, 0, 0, 0);
    const off = subscribeEvents(profile.uid, since, setEvents);
    return () => {
      off();
      setEvents(null);
    };
  }, [profile.uid, range]);

  const data = useMemo(() => {
    const evs = events ?? [];
    const start = new Date().setHours(0, 0, 0, 0) - (range - 1) * DAY;
    const days = Array.from({ length: range }, (_, i) => dayKey(start + i * DAY));
    const idx = new Map(days.map((d, i) => [d, i]));
    const views = days.map(() => 0);
    const clicks = days.map(() => 0);
    for (const e of evs) {
      const i = idx.get(e.day);
      if (i === undefined) continue;
      if (e.type === "view") views[i]++;
      else clicks[i]++;
    }
    const vEvents = evs.filter((e) => e.type === "view");
    const totalViews = views.reduce((a, b) => a + b, 0);
    const totalClicks = clicks.reduce((a, b) => a + b, 0);
    return {
      days,
      views,
      clicks,
      totalViews,
      totalClicks,
      ctr: totalViews > 0 ? Math.min(100, Math.round((totalClicks / totalViews) * 100)) : 0,
      referrers: countBy(vEvents, (e) => e.ref || "Direct").slice(0, 6),
      devices: countBy(vEvents, (e) => e.device),
      countries: countBy(vEvents, (e) => e.country || "").slice(0, 6),
    };
  }, [events, range]);

  const ranked = [...links].filter((l) => (l.kind ?? "link") === "link").sort((a, b) => b.clicks - a.clicks).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-500">All-time: {compact(profile.views)} views</p>
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-100">
          {([7, 30] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn("rounded-full px-4 py-1.5 text-xs font-bold transition", range === r ? "bg-brand text-white" : "text-zinc-500 hover:text-zinc-800")}>
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={LuEye} label="Views" value={compact(data.totalViews)} tint="bg-gradient-to-br from-violet-500 to-fuchsia-500" />
        <Stat icon={LuMousePointerClick} label="Clicks" value={compact(data.totalClicks)} tint="bg-gradient-to-br from-pink-500 to-orange-400" />
        <Stat icon={LuPercent} label="Click rate" value={`${data.ctr}%`} tint="bg-gradient-to-br from-sky-500 to-indigo-500" />
      </div>

      <Card title="Traffic over time">
        <div className="mb-2 flex gap-4 text-xs font-bold text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />Views</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Clicks</span>
        </div>
        {events === null ? (
          <div className="flex h-52 items-center justify-center"><LuLoaderCircle className="animate-spin text-violet-500" /></div>
        ) : (
          <TrendChart days={data.days} views={data.views} clicks={data.clicks} />
        )}
        {events !== null && data.totalViews + data.totalClicks === 0 && (
          <p className="mt-2 text-center text-xs font-medium text-zinc-400">No activity in this period yet — share your link to get started.</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top referrers" icon={<LuGlobe className="text-violet-500" />}>
          <BarList empty="No visits yet." rows={data.referrers.map((r) => ({ key: r.label, label: <span className="truncate">{r.label}</span>, count: r.count }))} />
        </Card>
        <Card title="Countries" icon={<span>🌍</span>}>
          <BarList
            empty="No visits yet."
            color="bg-gradient-to-r from-sky-500 to-indigo-500"
            rows={data.countries.map((c) => ({ key: c.label || "?", label: <><span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-600">{c.label || "—"}</span><span className="truncate">{countryName(c.label)}</span></>, count: c.count }))}
          />
          {data.countries.length > 0 && data.countries.every((c) => !c.label) && (
            <p className="mt-3 text-xs text-zinc-400">Country data appears once the site is hosted on Vercel or Cloudflare.</p>
          )}
        </Card>
      </div>

      <Card title="Devices" icon={<LuSmartphone className="text-pink-500" />}>
        <BarList
          empty="No visits yet."
          color="bg-gradient-to-r from-pink-500 to-orange-400"
          rows={data.devices.map((d) => {
            const Ico = DEVICE_ICON[d.label] ?? LuMonitor;
            return { key: d.label, label: <><Ico className="h-4 w-4 text-pink-500" /><span className="capitalize">{d.label}</span></>, count: d.count };
          })}
        />
      </Card>

      <Card title="Top links (all time)" icon={<LuTrophy className="text-amber-500" />}>
        <BarList
          empty="Add links to start collecting stats."
          rows={ranked.map((l) => {
            const { Icon } = getPlatform(l.url);
            return { key: l.id, label: <><Icon className="h-4 w-4 shrink-0 text-violet-500" /><span className="truncate">{l.title}</span></>, count: l.clicks };
          })}
        />
      </Card>
    </div>
  );
}
