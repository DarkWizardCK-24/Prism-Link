"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LuArrowUpRight, LuChevronDown } from "react-icons/lu";
import { parseEmbed } from "@/lib/embeds";
import { getPlatform } from "@/lib/platforms";
import { buttonCss, radiusFor, resolveTheme } from "@/lib/themes";
import { countdown } from "@/lib/time";
import { isLive, type LinkItem, type Profile } from "@/lib/types";
import { cn, safeHref } from "@/lib/utils";
import Avatar from "./ui/Avatar";
import { LogoMark } from "./ui/Logo";

type Core = Pick<Profile, "username" | "displayName" | "bio" | "avatarUrl" | "theme" | "buttonStyle" | "buttonShape">;
type Extras = Partial<Pick<Profile, "socials" | "bgType" | "bgColor" | "bgColor2" | "bgImage" | "bgOverlay">>;
export type ProfileLike = Core & Extras;
export type LinkLike = Pick<LinkItem, "id" | "title" | "url" | "active"> & Partial<LinkItem>;

const WEEK = 7 * 24 * 3600 * 1000;

export default function ProfileView({
  profile,
  links,
  preview = false,
  className,
  onLinkClick,
}: {
  profile: ProfileLike;
  links: LinkLike[];
  preview?: boolean;
  className?: string;
  onLinkClick?: (id: string) => void;
}) {
  const { theme, overlay, hasImage } = resolveTheme(profile);
  const [now, setNow] = useState(() => Date.now());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Keep schedules and countdowns fresh without a reload.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Walk items in order; items under a collapsed header (until the next header/divider) are hidden.
  const items: Array<{ link: LinkLike; hiddenBySection: boolean }> = [];
  let section: string | null = null;
  for (const l of links) {
    const kind = l.kind ?? "link";
    const live = isLive({ active: l.active, startAt: l.startAt ?? null, endAt: l.endAt ?? null }, now);
    if (kind === "header") {
      section = live && l.collapsible ? l.id : null;
      if (live) items.push({ link: l, hiddenBySection: false });
      continue;
    }
    if (kind === "divider") {
      section = null;
      if (live) items.push({ link: l, hiddenBySection: false });
      continue;
    }
    if (live) items.push({ link: l, hiddenBySection: section !== null && collapsed.has(section) });
  }
  const shown = items.filter((i) => !i.hiddenBySection);
  const realCount = items.filter((i) => (i.link.kind ?? "link") !== "divider" && (i.link.kind ?? "link") !== "header").length;
  const socials = (profile.socials ?? []).filter((s) => s.url);

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ background: theme.bg, color: theme.text }}>
      {hasImage && <div className="pointer-events-none absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />}
      {!hasImage && (
        <>
          <div
            className="animate-blob pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: theme.solid }}
          />
          <div
            className="animate-blob pointer-events-none absolute -right-24 bottom-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: theme.solid, animationDelay: "-6s" }}
          />
        </>
      )}

      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center px-5 pb-8 pt-14">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="rounded-full p-1"
          style={{ background: theme.solid }}
        >
          <Avatar url={profile.avatarUrl} name={profile.displayName || profile.username} className="h-24 w-24 border-4 border-white/70 text-3xl" />
        </motion.div>

        <motion.h1 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 text-center font-display text-2xl font-bold tracking-tight">
          {profile.displayName || `@${profile.username}`}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-0.5 text-sm font-medium" style={{ color: theme.subtext }}>
          @{profile.username}
        </motion.p>
        {profile.bio && (
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 max-w-sm whitespace-pre-line text-center text-[15px] leading-relaxed" style={{ color: theme.subtext }}>
            {profile.bio}
          </motion.p>
        )}

        {socials.length > 0 && (
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {socials.map((s, i) => {
              const { Icon, name } = getPlatform(s.url);
              return (
                <motion.li key={s.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 + i * 0.05, type: "spring", stiffness: 300, damping: 18 }} whileHover={{ y: -3, scale: 1.1 }} whileTap={{ scale: 0.92 }}>
                  <a
                    href={preview ? undefined : safeHref(s.url)}
                    onClick={(e) => preview && e.preventDefault()}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={name}
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: theme.glass, color: theme.text, border: `1px solid ${theme.line}`, backdropFilter: "blur(10px)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </motion.li>
              );
            })}
          </ul>
        )}

        <ul className="mt-7 w-full">
          <AnimatePresence initial={false}>
            {shown.map(({ link }, i) => {
              const kind = link.kind ?? "link";
              const enter = { delay: 0.3 + Math.min(i, 8) * 0.06, type: "spring" as const, stiffness: 260, damping: 22 };
              const wrap = {
                layout: "position" as const,
                initial: { y: 22, opacity: 0 },
                animate: { y: 0, opacity: 1, transition: enter },
                exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
                className: "mb-3.5",
              };

              if (kind === "divider") {
                return (
                  <motion.li key={link.id} {...wrap} className="py-2">
                    <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.line}, transparent)` }} />
                  </motion.li>
                );
              }

              if (kind === "header") {
                const open = !collapsed.has(link.id);
                const inner = (
                  <span className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: theme.subtext }}>
                    {link.title}
                    {link.collapsible && <LuChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} />}
                  </span>
                );
                return (
                  <motion.li key={link.id} {...wrap} className="mb-3 mt-5">
                    {link.collapsible ? (
                      <button onClick={() => toggle(link.id)} aria-expanded={open} className="w-full rounded-xl py-1.5">
                        {inner}
                      </button>
                    ) : (
                      inner
                    )}
                  </motion.li>
                );
              }

              if (kind === "embed") {
                const embed = parseEmbed(link.url);
                if (!embed) return null;
                return (
                  <motion.li key={link.id} {...wrap}>
                    {link.title && (
                      <p className="mb-1.5 px-1 text-center text-sm font-bold" style={{ color: theme.text }}>
                        {link.title}
                      </p>
                    )}
                    <div className="overflow-hidden shadow-xl shadow-black/20" style={{ borderRadius: radiusFor(profile.buttonShape === "square" ? "square" : "rounded") }}>
                      <iframe
                        src={embed.src}
                        title={link.title || `${embed.provider} player`}
                        loading="lazy"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className={cn("block w-full border-0", embed.height === null && "aspect-video")}
                        style={embed.height ? { height: embed.height } : undefined}
                      />
                    </div>
                  </motion.li>
                );
              }

              const { Icon } = getPlatform(link.url);
              const endsIn = link.endAt ? link.endAt - now : null;
              const showTimer = endsIn !== null && endsIn > 0 && endsIn < WEEK;
              const iconType = link.iconType ?? "auto";
              return (
                <motion.li key={link.id} {...wrap} whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <a
                    href={preview ? undefined : safeHref(link.url)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={(e) => {
                      if (preview) e.preventDefault();
                      else onLinkClick?.(link.id);
                    }}
                    style={buttonCss(theme, profile.buttonStyle, profile.buttonShape)}
                    className="relative flex min-h-14 items-center gap-3 px-3.5 py-2.5 text-[15px] font-semibold transition-shadow"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                      {iconType === "emoji" && link.emoji ? (
                        <span className="text-[22px] leading-none">{link.emoji}</span>
                      ) : iconType === "image" && link.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={link.thumbnail} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-center">
                      <span className="block truncate">{link.title}</span>
                      {showTimer && (
                        <span className="mt-0.5 block text-[11px] font-bold opacity-75">⏳ Ends in {countdown(endsIn)}</span>
                      )}
                    </span>
                    <LuArrowUpRight className="h-4 w-4 shrink-0 opacity-60" />
                  </a>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {realCount === 0 && (
            <li className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: theme.line, color: theme.subtext }}>
              No links yet — add your first one!
            </li>
          )}
        </ul>

        <a
          href={preview ? undefined : "/"}
          onClick={(e) => preview && e.preventDefault()}
          className="mt-8 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold opacity-80 transition hover:opacity-100"
          style={{ background: theme.glass, color: theme.text }}
        >
          <LogoMark className="h-4 w-4" /> Made with PrismLink
        </a>
      </div>
    </div>
  );
}
