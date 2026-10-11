"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  LuCheck,
  LuClock,
  LuGripVertical,
  LuHeading,
  LuLink,
  LuMinus,
  LuMousePointerClick,
  LuPencil,
  LuPlay,
  LuPlus,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { addLink, deleteLink, reorderLinks, updateLink } from "@/lib/db";
import { parseEmbed } from "@/lib/embeds";
import { getPlatform } from "@/lib/platforms";
import { shortDate } from "@/lib/time";
import type { ItemKind, LinkItem } from "@/lib/types";
import { cn, normalizeUrl } from "@/lib/utils";
import Button from "../ui/Button";
import ItemForm, { EMPTY_FIELDS, validateFields, type Fields } from "./ItemForm";

const ADD_OPTIONS: Array<{ kind: ItemKind; label: string; Icon: IconType }> = [
  { kind: "link", label: "Link", Icon: LuLink },
  { kind: "embed", label: "Embed", Icon: LuPlay },
  { kind: "header", label: "Header", Icon: LuHeading },
  { kind: "divider", label: "Divider", Icon: LuMinus },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Toggle visibility"
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-zinc-200")}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow", checked ? "right-1" : "left-1")} />
    </button>
  );
}

function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "amber" | "rose" | "emerald" }) {
  const tones = { amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-600", emerald: "bg-emerald-50 text-emerald-700" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[tone])}>{children}</span>;
}

function fieldsOf(l: LinkItem): Fields {
  return { title: l.title, url: l.url, iconType: l.iconType, emoji: l.emoji, thumbnail: l.thumbnail, startAt: l.startAt, endAt: l.endAt, collapsible: l.collapsible };
}

function ItemCard({ link, uid, now }: { link: LinkItem; uid: string; now: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [fields, setFields] = useState<Fields>(() => fieldsOf(link));
  const [saving, setSaving] = useState(false);

  const kind = link.kind;
  const { Icon, name } = getPlatform(link.url);
  const embed = kind === "embed" ? parseEmbed(link.url) : null;

  let tile: React.ReactNode = <Icon className="h-5 w-5" />;
  let title = link.title;
  let sub = `${name} · ${link.url.replace(/^https?:\/\//, "")}`;
  if (kind === "link" && link.iconType === "emoji" && link.emoji) tile = <span className="text-xl">{link.emoji}</span>;
  if (kind === "link" && link.iconType === "image" && link.thumbnail)
    // eslint-disable-next-line @next/next/no-img-element
    tile = <img src={link.thumbnail} alt="" className="h-full w-full object-cover" />;
  if (kind === "header") {
    tile = <LuHeading className="h-5 w-5" />;
    sub = link.collapsible ? "Header · collapsible section" : "Header";
  }
  if (kind === "divider") {
    tile = <LuMinus className="h-5 w-5" />;
    title = "Divider";
    sub = "Separator line";
  }
  if (kind === "embed") {
    tile = <LuPlay className="h-5 w-5" />;
    title = link.title || `${embed?.provider ?? "Embed"} player`;
    sub = `${embed?.provider ?? "Embed"} · inline player`;
  }

  const scheduled = !!link.startAt && now < link.startAt;
  const expired = !!link.endAt && now >= link.endAt;

  async function save() {
    const err = validateFields(kind, fields);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      await updateLink(uid, link.id, {
        title: fields.title.trim(),
        url: kind === "link" ? normalizeUrl(fields.url) : fields.url.trim(),
        iconType: fields.iconType,
        emoji: fields.emoji,
        thumbnail: fields.thumbnail,
        startAt: fields.startAt,
        endAt: fields.endAt,
        collapsible: fields.collapsible,
      });
      setEditing(false);
      toast.success("Updated");
    } catch {
      toast.error("Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
      className={cn(
        "rounded-3xl border p-3.5 shadow-sm sm:p-4",
        kind === "header" || kind === "divider" ? "border-dashed border-zinc-200 bg-white/70" : "border-zinc-100 bg-white",
        isDragging && "border-violet-300 shadow-2xl shadow-violet-500/20",
        (!link.active || expired) && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="touch-none cursor-grab rounded-lg p-1.5 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing" aria-label="Drag to reorder">
          <LuGripVertical className="h-5 w-5" />
        </button>
        <div className="bg-brand-soft flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-violet-600">{tile}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-zinc-900">{title}</p>
          <p className="truncate text-xs font-medium text-zinc-400">{sub}</p>
        </div>
        <Toggle checked={link.active} onChange={(v) => updateLink(uid, link.id, { active: v }).catch(() => toast.error("Couldn't update."))} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {kind === "link" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-500">
              <LuMousePointerClick className="h-3.5 w-3.5" /> {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
            </span>
          )}
          {scheduled && (
            <Badge tone="amber">
              <LuClock /> Starts {shortDate(link.startAt!)}
            </Badge>
          )}
          {expired && <Badge tone="rose">Expired</Badge>}
          {!scheduled && !expired && link.endAt && (
            <Badge tone="emerald">
              <LuClock /> Ends {shortDate(link.endAt)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {confirm ? (
            <>
              <span className="mr-1 text-xs font-semibold text-zinc-500">Delete?</span>
              <Button size="sm" variant="danger" onClick={() => deleteLink(uid, link.id).then(() => toast.success("Deleted")).catch(() => toast.error("Couldn't delete."))}>
                Yes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                No
              </Button>
            </>
          ) : (
            <>
              {kind !== "divider" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFields(fieldsOf(link));
                    setEditing((e) => !e);
                  }}
                  aria-label="Edit"
                >
                  {editing ? <LuX /> : <LuPencil />}
                </Button>
              )}
              <Button size="sm" variant="ghost" className="hover:!bg-rose-50 hover:!text-rose-600" onClick={() => setConfirm(true)} aria-label="Delete">
                <LuTrash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 pt-3">
              <ItemForm uid={uid} kind={kind} value={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} />
              <Button size="sm" loading={saving} onClick={save}>
                <LuCheck /> Save changes
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LinksPanel({ uid, links }: { uid: string; links: LinkItem[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ItemKind>("link");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [busy, setBusy] = useState(false);
  const now = useNow();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function create(k: ItemKind, f: Fields) {
    const err = validateFields(k, f);
    if (err) return toast.error(err);
    setBusy(true);
    try {
      await addLink(
        uid,
        { kind: k, title: f.title.trim(), url: k === "link" ? normalizeUrl(f.url) : f.url.trim(), iconType: f.iconType, emoji: f.emoji, thumbnail: f.thumbnail, startAt: f.startAt, endAt: f.endAt, collapsible: f.collapsible },
        links[0]?.order ?? 0,
      );
      setFields(EMPTY_FIELDS);
      setOpen(false);
      toast.success("Added");
    } catch {
      toast.error("Couldn't add. Check your Firestore rules.");
    } finally {
      setBusy(false);
    }
  }

  function pick(k: ItemKind) {
    setKind(k);
    setFields(EMPTY_FIELDS);
    if (k === "divider") void create(k, EMPTY_FIELDS);
    else setOpen(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void create(kind, fields);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = links.findIndex((l) => l.id === active.id);
    const to = links.findIndex((l) => l.id === over.id);
    reorderLinks(uid, arrayMove(links, from, to).map((l) => l.id)).catch(() => toast.error("Couldn't reorder."));
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {ADD_OPTIONS.map(({ kind: k, label, Icon }) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(k)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border bg-white py-3 text-xs font-bold shadow-sm transition",
              open && kind === k ? "border-violet-400 text-violet-700 ring-4 ring-violet-500/10" : "border-zinc-100 text-zinc-600 hover:border-violet-200 hover:text-violet-700",
              k === "link" && !open && "bg-brand border-transparent !text-white shadow-lg shadow-fuchsia-500/25",
            )}
          >
            <span className="relative flex items-center">
              <Icon className="h-5 w-5" />
              <LuPlus className="absolute -right-2.5 -top-2 h-3 w-3" />
            </span>
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
            <div className="rounded-3xl border border-violet-100 bg-white p-4 shadow-lg shadow-violet-500/10 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold capitalize">New {kind}</h3>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
                  <LuX />
                </button>
              </div>
              <ItemForm uid={uid} kind={kind} value={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} />
              <Button type="submit" loading={busy} className="mt-3 w-full">
                Add {kind}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-5 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {links.map((l) => (
                <ItemCard key={l.id} link={l} uid={uid} now={now} />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {links.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border-2 border-dashed border-zinc-200 px-6 py-14 text-center">
            <div className="bg-brand-soft mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-violet-600">
              <LuPlus className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display text-lg font-bold">Your page is empty</p>
            <p className="mt-1 text-sm text-zinc-500">Add your first link, embed or header to bring it to life.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
