"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { LuArrowUpRight, LuChevronDown } from "react-icons/lu";
import { parseEmbed } from "@/lib/embeds";
import { getPlatform } from "@/lib/platforms";
import { linkCss, radiusFor, resolveTheme } from "@/lib/themes";
import { countdown } from "@/lib/time";
import { isLive, type LinkItem, type Profile } from "@/lib/types";
import { cn, safeHref } from "@/lib/utils";
import Avatar from "./ui/Avatar";
import { LogoMark } from "./ui/Logo";

type Core = Pick<Profile, "username" | "displayName" | "bio" | "avatarUrl" | "theme" | "buttonStyle" | "buttonShape">;
type Extras = Partial<Pick<Profile, "socials" | "bgType" | "bgColor" | "bgColor2" | "bgImage" | "bgOverlay" | "cardFrom" | "cardTo">>;
export type ProfileLike = Core & Extras;
export type LinkLike = Pick<LinkItem, "id" | "title" | "url" | "active"> & Partial<LinkItem>;

const WEEK = 7 * 24 * 3600 * 1000;
type Grad = { from: string; to: string };

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

  const live = (l: LinkLike) => isLive({ active: l.active, startAt: l.startAt ?? null, endAt: l.endAt ?? null }, now);
  const sorted = [...links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groupIds = new Set(sorted.filter((l) => l.kind === "group").map((l) => l.id));
  const top = sorted.filter((l) => l.kind === "group" || !l.groupId || !groupIds.has(l.groupId));
  const kidsOf = (gid: string) => sorted.filter((l) => l.groupId === gid && l.kind !== "group" && live(l));

  const profileGrad: Grad = { from: profile.cardFrom ?? "", to: profile.cardTo ?? "" };
  // Priority: the link's own colour, then its group's, then the profile-wide default, then the theme style.
  const pickGrad = (...levels: Array<{ gradFrom?: string; gradTo?: string } | Grad | undefined>): Grad => {
    for (const l of levels) {
      const from = l && ("gradFrom" in l ? l.gradFrom : (l as Grad).from);
      const to = l && ("gradTo" in l ? l.gradTo : (l as Grad).to);
      if (from) return { from, to: to ?? "" };
    }
    return { from: "", to: "" };
  };

  const socials = (profile.socials ?? []).filter((s) => s.url);
  const liveTop = top.filter((l) => (l.kind === "group" ? live(l) && kidsOf(l.id).length > 0 : live(l)));
  const realCount = liveTop.filter((l) => !["divider", "header"].includes(l.kind ?? "link")).length;

  const enter = (i: number) => ({ delay: 0.3 + Math.min(i, 8) * 0.06, type: "spring" as const, stiffness: 260, damping: 22 });

  function renderItem(link: LinkLike, i: number, group?: LinkLike): ReactNode {
    const kind = link.kind ?? "link";
    const wrap = {
      initial: { y: 22, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: enter(i) },
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
      return (
        <motion.li key={link.id} {...wrap} className="mb-3 mt-5 text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: theme.subtext }}>
            {link.title}
          </span>
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
    const g = pickGrad(link, group, profileGrad);
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
          style={linkCss(theme, profile.buttonStyle, profile.buttonShape, g.from, g.to)}
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
            {showTimer && <span className="mt-0.5 block text-[11px] font-bold opacity-75">⏳ Ends in {countdown(endsIn)}</span>}
          </span>
          <LuArrowUpRight className="h-4 w-4 shrink-0 opacity-60" />
        </a>
      </motion.li>
    );
  }

  function renderGroup(group: LinkLike, i: number): ReactNode {
    const open = !collapsed.has(group.id);
    const kids = kidsOf(group.id);
    const heading = (
      <span className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: theme.text }}>
        {group.title}
        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal" style={{ background: theme.glass, color: theme.subtext }}>
          {kids.length}
        </span>
        {group.collapsible && <LuChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} />}
      </span>
    );
    return (
      <motion.li
        key={group.id}
        initial={{ y: 22, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: enter(i) }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
        className="relative mb-5 rounded-[28px] p-3"
        style={{ border: `1px solid ${theme.line}` }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-40" style={{ background: theme.glass }} />
        <div className="relative">
          {group.collapsible ? (
            <button onClick={() => toggle(group.id)} aria-expanded={open} className="w-full rounded-xl py-2">
              {heading}
            </button>
          ) : (
            <div className="py-2">{heading}</div>
          )}
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul key="kids" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden px-1 pt-1">
                {kids.map((k, ki) => renderItem(k, ki, group))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </motion.li>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ background: theme.bg, color: theme.text }}>
      {hasImage && <div className="pointer-events-none absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />}
      {!hasImage && (
        <>
          <div className="animate-blob pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: theme.solid }} />
          <div className="animate-blob pointer-events-none absolute -right-24 bottom-24 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: theme.solid, animationDelay: "-6s" }} />
        </>
      )}

      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center px-5 pb-8 pt-14">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="rounded-full p-1" style={{ background: theme.solid }}>
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
            {liveTop.map((l, i) => (l.kind === "group" ? renderGroup(l, i) : renderItem(l, i)))}
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
