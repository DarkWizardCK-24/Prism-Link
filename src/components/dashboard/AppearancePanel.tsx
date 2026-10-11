"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { LuCheck, LuDices, LuImagePlus, LuLoaderCircle, LuPlus, LuSave, LuUpload, LuX } from "react-icons/lu";
import type { ProfileEdit } from "@/lib/db";
import { getPlatform } from "@/lib/platforms";
import { THEMES, buttonCss, radiusFor } from "@/lib/themes";
import type { BgType, ButtonShape, ButtonStyle, Profile } from "@/lib/types";
import { uploadImage } from "@/lib/upload";
import { avatarFor, cn, normalizeUrl } from "@/lib/utils";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import GradientPicker from "../ui/GradientPicker";

export type Draft = ProfileEdit;

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="font-display text-base font-bold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

const STYLES: ButtonStyle[] = ["solid", "glass", "outline"];
const SHAPES: ButtonShape[] = ["pill", "rounded", "square"];
const BG_TYPES: Array<{ id: BgType; label: string }> = [
  { id: "theme", label: "Theme" },
  { id: "color", label: "Color" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Image" },
];
const SOCIAL_QUICK = [
  { label: "instagram.com/", base: "instagram.com/" },
  { label: "x.com/", base: "x.com/" },
  { label: "youtube.com/@", base: "youtube.com/@" },
  { label: "tiktok.com/@", base: "tiktok.com/@" },
  { label: "github.com/", base: "github.com/" },
  { label: "linkedin.com/in/", base: "linkedin.com/in/" },
  { label: "facebook.com/", base: "facebook.com/" },
  { label: "t.me/", base: "t.me/" },
  { label: "discord.gg/", base: "discord.gg/" },
  { label: "mailto:", base: "mailto:" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-2.5 text-xs font-bold text-zinc-500">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <span className="flex-1">
        {label}
        <span className="block font-mono text-[11px] font-semibold uppercase text-zinc-400">{value}</span>
      </span>
    </label>
  );
}

export default function AppearancePanel({
  value,
  onChange,
  dirty,
  saving,
  onSave,
  onReset,
}: {
  value: Profile;
  onChange: (patch: Draft) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  const sample = THEMES.find((t) => t.id === value.theme) ?? THEMES[0];
  const avatarFile = useRef<HTMLInputElement>(null);
  const bgFile = useRef<HTMLInputElement>(null);
  const socialInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"avatar" | "bg" | null>(null);
  const [social, setSocial] = useState("");

  async function upload(kind: "avatar" | "background", file?: File) {
    if (!file) return;
    setBusy(kind === "avatar" ? "avatar" : "bg");
    try {
      const url = await uploadImage(value.uid, file, kind);
      onChange(kind === "avatar" ? { avatarUrl: url } : { bgImage: url, bgType: "image" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
      if (avatarFile.current) avatarFile.current.value = "";
      if (bgFile.current) bgFile.current.value = "";
    }
  }

  function addSocial() {
    const url = normalizeUrl(social);
    if (!url) return toast.error("Enter a valid profile URL or mailto: address.");
    if (value.socials.length >= 10) return toast.error("You can add up to 10 social icons.");
    onChange({ socials: [...value.socials, { id: Math.random().toString(36).slice(2, 9), url }] });
    setSocial("");
  }

  return (
    <div className="space-y-4">
      <Section title="Profile">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar url={value.avatarUrl} name={value.displayName || value.username} className="h-20 w-20 text-2xl" />
            {busy === "avatar" && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                <LuLoaderCircle className="animate-spin text-violet-600" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input ref={avatarFile} type="file" accept="image/*" hidden onChange={(e) => upload("avatar", e.target.files?.[0])} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => avatarFile.current?.click()}>
                <LuUpload /> Upload photo
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onChange({ avatarUrl: avatarFor(`${value.username}-${Math.random().toString(36).slice(2, 7)}`) })}>
                <LuDices /> Random
              </Button>
              {value.avatarUrl && (
                <Button size="sm" variant="ghost" onClick={() => onChange({ avatarUrl: "" })}>
                  Remove
                </Button>
              )}
            </div>
            <input className={cn(inputCls, "h-10")} placeholder="…or paste an image URL" value={value.avatarUrl.startsWith("data:") ? "" : value.avatarUrl} onChange={(e) => onChange({ avatarUrl: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <input className={cn(inputCls, "h-11")} placeholder="Display name" value={value.displayName} maxLength={50} onChange={(e) => onChange({ displayName: e.target.value })} />
          <div>
            <textarea className={cn(inputCls, "min-h-24 resize-none py-3")} placeholder="Short bio" value={value.bio} maxLength={160} onChange={(e) => onChange({ bio: e.target.value })} />
            <p className="mt-1 text-right text-xs font-medium text-zinc-400">{value.bio.length}/160</p>
          </div>
        </div>
      </Section>

      <Section title="Social icons" hint="Shown as a row of round icons under your bio.">
        {value.socials.length > 0 && (
          <ul className="mb-3 space-y-2">
            {value.socials.map((s) => {
              const { Icon, name } = getPlatform(s.url);
              return (
                <motion.li layout key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-2 pr-3">
                  <span className="bg-brand-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{name}</span>
                    <span className="block truncate text-xs text-zinc-400">{s.url.replace(/^https?:\/\//, "")}</span>
                  </span>
                  <button onClick={() => onChange({ socials: value.socials.filter((x) => x.id !== s.id) })} className="rounded-full p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${name}`}>
                    <LuX />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            ref={socialInput}
            className={cn(inputCls, "h-11 flex-1")}
            placeholder="instagram.com/yourname"
            value={social}
            onChange={(e) => setSocial(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSocial())}
          />
          <Button onClick={addSocial} aria-label="Add social icon">
            <LuPlus />
          </Button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {SOCIAL_QUICK.map((q) => {
            const { Icon } = getPlatform(q.base.startsWith("mailto") ? q.base + "a@b.co" : q.base);
            return (
              <button
                key={q.base}
                onClick={() => {
                  setSocial(q.base);
                  socialInput.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 transition hover:bg-violet-100 hover:text-violet-700"
              >
                <Icon className="h-3 w-3" /> {q.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Theme">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => {
            const active = t.id === value.theme;
            return (
              <motion.button
                key={t.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onChange({ theme: t.id })}
                className={cn("relative overflow-hidden rounded-2xl p-1.5 text-left ring-2 transition", active ? "ring-violet-500" : "ring-transparent hover:ring-zinc-200")}
                aria-pressed={active}
              >
                <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl px-3" style={{ background: t.bg }}>
                  <span className="h-2 w-12 rounded-full" style={{ background: t.solid }} />
                  <span className="h-2 w-16 rounded-full" style={{ background: t.glass, border: `1px solid ${t.line}` }} />
                </div>
                <p className="px-1 pb-0.5 pt-1.5 text-xs font-bold text-zinc-700">{t.name}</p>
                {active && (
                  <span className="bg-brand absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-white">
                    <LuCheck className="h-3 w-3" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Section title="Background" hint="Override the theme with your own colour, gradient or photo.">
        <div className="inline-flex rounded-full bg-zinc-100 p-1">
          {BG_TYPES.map((b) => (
            <button key={b.id} onClick={() => onChange({ bgType: b.id })} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition", value.bgType === b.id ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>
              {b.label}
            </button>
          ))}
        </div>

        {value.bgType === "color" && (
          <div className="mt-3.5">
            <ColorField label="Background colour" value={value.bgColor} onChange={(v) => onChange({ bgColor: v })} />
          </div>
        )}
        {value.bgType === "gradient" && (
          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            <ColorField label="From" value={value.bgColor} onChange={(v) => onChange({ bgColor: v })} />
            <ColorField label="To" value={value.bgColor2} onChange={(v) => onChange({ bgColor2: v })} />
            <div className="h-12 rounded-2xl sm:col-span-2" style={{ background: `linear-gradient(160deg, ${value.bgColor}, ${value.bgColor2})` }} />
          </div>
        )}
        {value.bgType === "image" && (
          <div className="mt-3.5 space-y-3">
            <input ref={bgFile} type="file" accept="image/*" hidden onChange={(e) => upload("background", e.target.files?.[0])} />
            <button onClick={() => bgFile.current?.click()} className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-violet-300" style={value.bgImage ? { background: `url("${value.bgImage}") center / cover` } : undefined}>
              <span className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold", value.bgImage ? "bg-black/50 text-white" : "text-zinc-500")}>
                {busy === "bg" ? <LuLoaderCircle className="animate-spin" /> : <LuImagePlus />} {value.bgImage ? "Change image" : "Upload background"}
              </span>
            </button>
            <label className="block text-xs font-bold text-zinc-500">
              Dark overlay · {value.bgOverlay}%
              <input type="range" min={0} max={80} value={value.bgOverlay} onChange={(e) => onChange({ bgOverlay: Number(e.target.value) })} className="mt-1.5 w-full accent-violet-600" />
            </label>
          </div>
        )}
      </Section>

      <Section title="Link card colour" hint="A default gradient for every link card. Groups and individual links can override it.">
        <GradientPicker label="All link cards" from={value.cardFrom} to={value.cardTo} onChange={(cardFrom, cardTo) => onChange({ cardFrom, cardTo })} />
      </Section>

      <Section title="Buttons">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Style</p>
        <div className="grid grid-cols-3 gap-2.5">
          {STYLES.map((s) => (
            <button key={s} onClick={() => onChange({ buttonStyle: s })} className={cn("rounded-2xl p-2 ring-2 transition", value.buttonStyle === s ? "ring-violet-500" : "ring-zinc-100 hover:ring-zinc-200")}>
              <div className="flex h-14 items-center justify-center rounded-xl px-2" style={{ background: sample.bg }}>
                <span className="w-full py-1.5 text-center text-[11px] font-bold" style={buttonCss(sample, s, value.buttonShape)}>
                  Link
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold capitalize text-zinc-600">{s}</p>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Shape</p>
        <div className="grid grid-cols-3 gap-2.5">
          {SHAPES.map((s) => (
            <button key={s} onClick={() => onChange({ buttonShape: s })} className={cn("flex h-12 items-center justify-center border-2 text-xs font-bold capitalize transition", value.buttonShape === s ? "border-violet-500 bg-violet-50 text-violet-700" : "border-zinc-100 text-zinc-500 hover:border-zinc-200")} style={{ borderRadius: radiusFor(s) }}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <motion.div initial={false} animate={{ y: dirty ? 0 : 20, opacity: dirty ? 1 : 0, pointerEvents: dirty ? "auto" : "none" }} className="sticky bottom-24 z-10 flex gap-2.5 rounded-full bg-white/90 p-2 shadow-xl shadow-violet-500/20 ring-1 ring-zinc-100 backdrop-blur lg:bottom-6">
        <Button variant="ghost" className="flex-1" onClick={onReset}>
          Discard
        </Button>
        <Button className="flex-[2]" loading={saving} onClick={onSave}>
          <LuSave /> Save changes
        </Button>
      </motion.div>
    </div>
  );
}
