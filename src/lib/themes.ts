import type { CSSProperties } from "react";
import type { BgType, ButtonShape, ButtonStyle } from "./types";

export interface Theme {
  id: string;
  name: string;
  bg: string;
  text: string;
  subtext: string;
  solid: string;
  solidText: string;
  glass: string;
  line: string;
}

export const THEMES: Theme[] = [
  {
    id: "aurora",
    name: "Aurora",
    bg: "radial-gradient(circle at 20% 0%, #7c3aed55, transparent 50%), radial-gradient(circle at 90% 90%, #ec489955, transparent 50%), linear-gradient(160deg,#0f0c29,#302b63 55%,#24243e)",
    text: "#ffffff",
    subtext: "rgba(255,255,255,.72)",
    solid: "linear-gradient(90deg,#a78bfa,#f472b6)",
    solidText: "#ffffff",
    glass: "rgba(255,255,255,.10)",
    line: "rgba(255,255,255,.28)",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "linear-gradient(160deg,#ff9a56,#ff4d79 50%,#7b2ff7)",
    text: "#ffffff",
    subtext: "rgba(255,255,255,.85)",
    solid: "#ffffff",
    solidText: "#be123c",
    glass: "rgba(255,255,255,.18)",
    line: "rgba(255,255,255,.55)",
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "linear-gradient(160deg,#22d3ee,#2563eb 60%,#4338ca)",
    text: "#ffffff",
    subtext: "rgba(255,255,255,.85)",
    solid: "#ffffff",
    solidText: "#1d4ed8",
    glass: "rgba(255,255,255,.18)",
    line: "rgba(255,255,255,.55)",
  },
  {
    id: "mint",
    name: "Mint",
    bg: "linear-gradient(160deg,#ecfdf5,#a7f3d0 55%,#6ee7b7)",
    text: "#064e3b",
    subtext: "rgba(6,78,59,.75)",
    solid: "#065f46",
    solidText: "#ffffff",
    glass: "rgba(255,255,255,.55)",
    line: "rgba(6,95,70,.35)",
  },
  {
    id: "candy",
    name: "Candy",
    bg: "linear-gradient(160deg,#fbc2eb,#c4b5fd 60%,#a6c1ee)",
    text: "#3b0764",
    subtext: "rgba(59,7,100,.72)",
    solid: "linear-gradient(90deg,#7c3aed,#db2777)",
    solidText: "#ffffff",
    glass: "rgba(255,255,255,.5)",
    line: "rgba(59,7,100,.3)",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "radial-gradient(circle at 80% 0%, #22d3ee33, transparent 45%), linear-gradient(160deg,#05050c,#14102b 60%,#1e1b4b)",
    text: "#f5f3ff",
    subtext: "rgba(245,243,255,.65)",
    solid: "linear-gradient(90deg,#22d3ee,#6366f1)",
    solidText: "#ffffff",
    glass: "rgba(255,255,255,.07)",
    line: "rgba(165,180,252,.4)",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "linear-gradient(160deg,#134e4a,#064e3b 55%,#022c22)",
    text: "#ecfdf5",
    subtext: "rgba(236,253,245,.7)",
    solid: "#34d399",
    solidText: "#022c22",
    glass: "rgba(255,255,255,.08)",
    line: "rgba(110,231,183,.4)",
  },
  {
    id: "paper",
    name: "Paper",
    bg: "linear-gradient(160deg,#ffffff,#f4f4f5)",
    text: "#18181b",
    subtext: "rgba(24,24,27,.62)",
    solid: "#18181b",
    solidText: "#ffffff",
    glass: "#ffffff",
    line: "rgba(24,24,27,.2)",
  },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function radiusFor(shape: ButtonShape) {
  return shape === "pill" ? "9999px" : shape === "rounded" ? "18px" : "6px";
}

export function buttonCss(theme: Theme, style: ButtonStyle, shape: ButtonShape): CSSProperties {
  const base: CSSProperties = { borderRadius: radiusFor(shape) };
  if (style === "solid") {
    return { ...base, background: theme.solid, color: theme.solidText, boxShadow: "0 8px 24px -10px rgba(0,0,0,.45)" };
  }
  if (style === "outline") {
    return { ...base, background: "transparent", color: theme.text, border: `2px solid ${theme.line}` };
  }
  return {
    ...base,
    background: theme.glass,
    color: theme.text,
    border: `1px solid ${theme.line}`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };
}

interface BgLike {
  theme: string;
  bgType?: BgType;
  bgColor?: string;
  bgColor2?: string;
  bgImage?: string;
  bgOverlay?: number;
}

function luminance(hex: string) {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.2;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const LIGHT_TEXT = {
  text: "#ffffff",
  subtext: "rgba(255,255,255,.8)",
  solid: "#ffffff",
  solidText: "#18181b",
  glass: "rgba(255,255,255,.16)",
  line: "rgba(255,255,255,.45)",
};
const DARK_TEXT = {
  text: "#18181b",
  subtext: "rgba(24,24,27,.66)",
  solid: "#18181b",
  solidText: "#ffffff",
  glass: "rgba(255,255,255,.65)",
  line: "rgba(24,24,27,.22)",
};

/** Applies a custom colour / gradient / image background on top of the chosen theme, keeping text readable. */
export function resolveTheme(p: BgLike): { theme: Theme; overlay: number; hasImage: boolean } {
  const base = getTheme(p.theme);
  const type = p.bgType ?? "theme";
  if (type === "color" && p.bgColor) {
    const v = luminance(p.bgColor) > 0.45 ? DARK_TEXT : LIGHT_TEXT;
    return { theme: { ...base, ...v, bg: p.bgColor }, overlay: 0, hasImage: false };
  }
  if (type === "gradient" && p.bgColor && p.bgColor2) {
    const lum = (luminance(p.bgColor) + luminance(p.bgColor2)) / 2;
    const v = lum > 0.45 ? DARK_TEXT : LIGHT_TEXT;
    return { theme: { ...base, ...v, bg: `linear-gradient(160deg, ${p.bgColor}, ${p.bgColor2})` }, overlay: 0, hasImage: false };
  }
  if (type === "image" && p.bgImage && /^(https:\/\/|data:image\/)[^"'()\s]+$/.test(p.bgImage)) {
    return {
      theme: { ...base, ...LIGHT_TEXT, bg: `#18181b url("${p.bgImage}") center / cover no-repeat` },
      overlay: Math.min(80, Math.max(0, p.bgOverlay ?? 30)) / 100,
      hasImage: true,
    };
  }
  return { theme: base, overlay: 0, hasImage: false };
}
