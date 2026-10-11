export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "forgot",
  "dashboard",
  "api",
  "admin",
  "settings",
  "about",
  "help",
  "support",
  "prism",
  "prismlink",
  "_next",
]);

export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

/** Returns a safe absolute URL (http/https/mailto/tel only) or "" when invalid. */
export function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^(mailto:|tel:)/i.test(v)) return v.length > 7 ? v : "";
  if (/^https?:\/\//i.test(v)) return isValidHttp(v) ? v : "";
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(v) || v.includes("://")) return "";
  const withScheme = `https://${v}`;
  return isValidHttp(withScheme) ? withScheme : "";
}

function isValidHttp(v: string) {
  try {
    const u = new URL(v);
    return u.hostname.includes(".") || u.hostname === "localhost";
  } catch {
    return false;
  }
}

export function safeHref(url: string) {
  return normalizeUrl(url) || "#";
}

export function avatarFor(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?backgroundType=gradientLinear&backgroundColor=c0aede,ffd5dc,ffdfbf,d1d4f9&seed=${encodeURIComponent(
    seed,
  )}`;
}

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function profileUrl(username: string) {
  if (typeof window === "undefined") return `/${username}`;
  return `${window.location.origin}/${username}`;
}

export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}
