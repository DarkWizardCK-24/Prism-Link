import type { AnalyticsEvent } from "./types";
import { dayKey } from "./time";

export function detectDevice(): AnalyticsEvent["device"] {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function detectReferrer(): string {
  try {
    if (!document.referrer) return "Direct";
    const u = new URL(document.referrer);
    if (u.origin === window.location.origin) return "Direct";
    return u.hostname.replace(/^(www|m|l)\./, "").slice(0, 60);
  } catch {
    return "Direct";
  }
}

export async function detectCountry(): Promise<string> {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    return ((await res.json()) as { country?: string }).country ?? "";
  } catch {
    return "";
  }
}

export async function buildEvent(type: "view" | "click", linkId?: string): Promise<AnalyticsEvent> {
  const ts = Date.now();
  const ev: AnalyticsEvent = {
    type,
    ts,
    day: dayKey(ts),
    ref: detectReferrer(),
    device: detectDevice(),
    country: await detectCountry(),
  };
  if (linkId) ev.linkId = linkId;
  return ev;
}

export function countBy<T>(items: T[], key: (t: T) => string): Array<{ label: string; count: number }> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function countryName(code: string): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
