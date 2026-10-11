"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { LuImagePlus, LuLoaderCircle } from "react-icons/lu";
import { parseEmbed } from "@/lib/embeds";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import type { IconKind, ItemKind } from "@/lib/types";
import { uploadImage } from "@/lib/upload";
import { cn, normalizeUrl } from "@/lib/utils";
import GradientPicker from "../ui/GradientPicker";

export interface Fields {
  title: string;
  url: string;
  iconType: IconKind;
  emoji: string;
  thumbnail: string;
  startAt: number | null;
  endAt: number | null;
  collapsible: boolean;
  gradFrom: string;
  gradTo: string;
}

export const EMPTY_FIELDS: Fields = {
  title: "",
  url: "",
  iconType: "auto",
  emoji: "",
  thumbnail: "",
  startAt: null,
  endAt: null,
  collapsible: false,
  gradFrom: "",
  gradTo: "",
};

export const inputCls =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15";

const EMOJIS = ["🔥", "✨", "🎵", "🎬", "📸", "🛍️", "💼", "📚", "🎮", "💌", "🌍", "🎧", "🍕", "☕", "💡", "🚀", "❤️", "⭐", "🎨", "📱", "💻", "🎁", "📍", "🏆", "🧠", "🌈", "📝", "🎤"];

const firstGrapheme = (v: string) => [...new Intl.Segmenter().segment(v)][0]?.segment ?? "";

/** Returns an error message, or null when the fields are valid for the given kind. */
export function validateFields(kind: ItemKind, f: Fields): string | null {
  if (kind === "divider") return null;
  if (!f.title.trim() && kind !== "embed") return "Please enter a title.";
  if (f.gradFrom && !/^#[0-9a-f]{6}$/i.test(f.gradFrom)) return "Pick a valid card colour.";
  if (kind === "link" && !normalizeUrl(f.url)) return "Enter a valid URL.";
  if (kind === "embed" && !parseEmbed(f.url)) return "Paste a YouTube, Spotify or SoundCloud link.";
  if (f.startAt && f.endAt && f.endAt <= f.startAt) return "The end time must be after the start time.";
  return null;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-zinc-100 p-1">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} className={cn("rounded-full px-3.5 py-1 text-xs font-bold transition", value === o.id ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconPicker({ uid, value, onChange }: { uid: string; value: Fields; onChange: (p: Partial<Fields>) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      onChange({ thumbnail: await uploadImage(uid, f, "thumb"), iconType: "image" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Icon</span>
        <Segmented<IconKind>
          value={value.iconType}
          onChange={(iconType) => onChange({ iconType })}
          options={[
            { id: "auto", label: "Auto" },
            { id: "emoji", label: "Emoji" },
            { id: "image", label: "Image" },
          ]}
        />
      </div>

      {value.iconType === "auto" && <p className="text-xs text-zinc-500">The icon is picked automatically from the link (Instagram, YouTube, GitHub…).</p>}

      {value.iconType === "emoji" && (
        <div>
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => onChange({ emoji: e })} className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-white", value.emoji === e && "bg-white ring-2 ring-violet-500")}>
                {e}
              </button>
            ))}
          </div>
          <input className={`${inputCls} mt-2.5`} placeholder="…or type / paste any emoji" value={value.emoji} onChange={(e) => onChange({ emoji: firstGrapheme(e.target.value) })} />
        </div>
      )}

      {value.iconType === "image" && (
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200">
            {value.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <LuImagePlus className="h-5 w-5 text-zinc-300" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <button type="button" onClick={() => file.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
              {busy ? <LuLoaderCircle className="animate-spin" /> : <LuImagePlus />} Upload image
            </button>
            <input className={cn(inputCls, "h-9 text-xs")} placeholder="or paste an image URL" value={value.thumbnail.startsWith("data:") ? "" : value.thumbnail} onChange={(e) => onChange({ thumbnail: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleFields({ value, onChange }: { value: Fields; onChange: (p: Partial<Fields>) => void }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Schedule (optional)</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-zinc-500">
          Show from
          <input type="datetime-local" className={`${inputCls} mt-1`} value={toLocalInput(value.startAt)} onChange={(e) => onChange({ startAt: fromLocalInput(e.target.value) })} />
        </label>
        <label className="block text-xs font-semibold text-zinc-500">
          Hide after
          <input type="datetime-local" className={`${inputCls} mt-1`} value={toLocalInput(value.endAt)} onChange={(e) => onChange({ endAt: fromLocalInput(e.target.value) })} />
        </label>
      </div>
      {(value.startAt || value.endAt) && (
        <button type="button" onClick={() => onChange({ startAt: null, endAt: null })} className="mt-2 text-xs font-bold text-violet-600 hover:underline">
          Clear schedule
        </button>
      )}
    </div>
  );
}

export default function ItemForm({ uid, kind, value, onChange }: { uid: string; kind: ItemKind; value: Fields; onChange: (p: Partial<Fields>) => void }) {
  if (kind === "divider") {
    return <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500">A subtle line that separates parts of your page.</p>;
  }

  const placeholders: Record<string, string> = {
    group: "Group name — e.g. Latest work",
    header: "Heading — e.g. Find me online",
    embed: "Title (optional)",
    link: "Title — e.g. My Portfolio",
  };

  return (
    <div className="space-y-2.5">
      <input className={inputCls} placeholder={placeholders[kind]} value={value.title} maxLength={80} onChange={(e) => onChange({ title: e.target.value })} />

      {(kind === "link" || kind === "embed") && (
        <input
          className={inputCls}
          placeholder={kind === "embed" ? "YouTube, Spotify or SoundCloud URL" : "URL — e.g. instagram.com/you"}
          value={value.url}
          inputMode="url"
          onChange={(e) => onChange({ url: e.target.value })}
        />
      )}

      {kind === "group" && (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-50 p-3 text-sm font-semibold text-zinc-700">
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={value.collapsible} onChange={(e) => onChange({ collapsible: e.target.checked })} />
          Collapsible — visitors can fold this group open and closed
        </label>
      )}

      {kind === "link" && <IconPicker uid={uid} value={value} onChange={onChange} />}
      {(kind === "link" || kind === "group") && (
        <GradientPicker
          from={value.gradFrom}
          to={value.gradTo}
          onChange={(gradFrom, gradTo) => onChange({ gradFrom, gradTo })}
          label={kind === "group" ? "Card colour for links in this group" : "Card colour"}
          hint={kind === "group" ? "Links in the group use this unless they have their own colour." : undefined}
        />
      )}
      <ScheduleFields value={value} onChange={onChange} />
    </div>
  );
}
