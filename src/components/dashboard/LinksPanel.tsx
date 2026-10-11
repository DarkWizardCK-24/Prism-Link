"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  LuCheck,
  LuChevronDown,
  LuClock,
  LuFolder,
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
import { addLink, deleteGroup, deleteLink, moveItems, updateLink } from "@/lib/db";
import { parseEmbed } from "@/lib/embeds";
import { getPlatform } from "@/lib/platforms";
import { linkCss, THEMES } from "@/lib/themes";
import { shortDate } from "@/lib/time";
import type { ItemKind, LinkItem } from "@/lib/types";
import { cn, normalizeUrl } from "@/lib/utils";
import Button from "../ui/Button";
import ItemForm, { EMPTY_FIELDS, validateFields, type Fields } from "./ItemForm";

const ROOT = "c:root";
type Tree = Record<string, string[]>;

const ADD_OPTIONS: Array<{ kind: ItemKind; label: string; Icon: IconType }> = [
  { kind: "link", label: "Link", Icon: LuLink },
  { kind: "group", label: "Group", Icon: LuFolder },
  { kind: "embed", label: "Embed", Icon: LuPlay },
  { kind: "header", label: "Header", Icon: LuHeading },
  { kind: "divider", label: "Divider", Icon: LuMinus },
];

/** Builds the container → ordered ids map: "c:root" for top-level items and "c:<groupId>" for each group. */
function buildTree(links: LinkItem[]): Tree {
  const groups = new Set(links.filter((l) => l.kind === "group").map((l) => l.id));
  const tree: Tree = { [ROOT]: [] };
  groups.forEach((g) => (tree[`c:${g}`] = []));
  for (const l of [...links].sort((a, b) => a.order - b.order)) {
    const inGroup = l.kind !== "group" && l.groupId && groups.has(l.groupId);
    tree[inGroup ? `c:${l.groupId}` : ROOT].push(l.id);
  }
  return tree;
}

const findContainer = (tree: Tree, id: string) => (id in tree ? id : Object.keys(tree).find((k) => tree[k].includes(id)));

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

function Badge({ children, tone }: { children: ReactNode; tone: "amber" | "rose" | "emerald" }) {
  const tones = { amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-600", emerald: "bg-emerald-50 text-emerald-700" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[tone])}>{children}</span>;
}

function fieldsOf(l: LinkItem): Fields {
  return { title: l.title, url: l.url, iconType: l.iconType, emoji: l.emoji, thumbnail: l.thumbnail, startAt: l.startAt, endAt: l.endAt, collapsible: l.collapsible, gradFrom: l.gradFrom, gradTo: l.gradTo };
}

/** Icon tile + title shown for an item, shared by the list card and the drag overlay. */
function describe(link: LinkItem, childCount = 0) {
  const { Icon, name } = getPlatform(link.url);
  const embed = link.kind === "embed" ? parseEmbed(link.url) : null;
  let tile: ReactNode = <Icon className="h-5 w-5" />;
  let title = link.title;
  let sub = `${name} · ${link.url.replace(/^https?:\/\//, "")}`;
  let tileStyle: React.CSSProperties | undefined;

  if (link.kind === "link") {
    if (link.iconType === "emoji" && link.emoji) tile = <span className="text-xl">{link.emoji}</span>;
    // eslint-disable-next-line @next/next/no-img-element
    if (link.iconType === "image" && link.thumbnail) tile = <img src={link.thumbnail} alt="" className="h-full w-full object-cover" />;
    if (link.gradFrom) {
      tileStyle = linkCss(THEMES[0], "solid", "rounded", link.gradFrom, link.gradTo);
      tileStyle = { ...tileStyle, boxShadow: "none" };
    }
  }
  if (link.kind === "group") {
    tile = <LuFolder className="h-5 w-5" />;
    sub = `${childCount} ${childCount === 1 ? "link" : "links"}${link.collapsible ? " · collapsible" : ""}`;
    if (link.gradFrom) tileStyle = { ...linkCss(THEMES[0], "solid", "rounded", link.gradFrom, link.gradTo), boxShadow: "none" };
  }
  if (link.kind === "header") {
    tile = <LuHeading className="h-5 w-5" />;
    sub = "Heading";
  }
  if (link.kind === "divider") {
    tile = <LuMinus className="h-5 w-5" />;
    title = "Divider";
    sub = "Separator line";
  }
  if (link.kind === "embed") {
    tile = <LuPlay className="h-5 w-5" />;
    title = link.title || `${embed?.provider ?? "Embed"} player`;
    sub = `${embed?.provider ?? "Embed"} · inline player`;
  }
  return { tile, title, sub, tileStyle };
}

function ItemCard({
  link,
  uid,
  now,
  childCount = 0,
  body,
  onAddChild,
  onDelete,
}: {
  link: LinkItem;
  uid: string;
  now: number;
  childCount?: number;
  body?: ReactNode;
  onAddChild?: () => void;
  onDelete: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [open, setOpen] = useState(true);
  const [fields, setFields] = useState<Fields>(() => fieldsOf(link));
  const [saving, setSaving] = useState(false);

  const kind = link.kind;
  const isGroup = kind === "group";
  const { tile, title, sub, tileStyle } = describe(link, childCount);
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
        gradFrom: fields.gradFrom,
        gradTo: fields.gradTo,
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
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.35 : 1, position: "relative", zIndex: isDragging ? 20 : undefined }} data-item-id={link.id} data-kind={kind}>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -40, scale: 0.95 }}
        className={cn(
          "rounded-3xl border p-3.5 shadow-sm sm:p-4",
          isGroup ? "border-violet-100 bg-white/80" : kind === "header" || kind === "divider" ? "border-dashed border-zinc-200 bg-white/70" : "border-zinc-100 bg-white",
          (!link.active || expired) && "opacity-70",
        )}
      >
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="touch-none cursor-grab rounded-lg p-1.5 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing" aria-label={`Drag ${title}`} data-drag-handle>
            <LuGripVertical className="h-5 w-5" />
          </button>
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl", !tileStyle && "bg-brand-soft text-violet-600")} style={tileStyle}>
            {tile}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-zinc-900">{title}</p>
            <p className="truncate text-xs font-medium text-zinc-400">{sub}</p>
          </div>
          {isGroup && (
            <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? "Collapse group" : "Expand group"} aria-expanded={open} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100">
              <LuChevronDown className={cn("h-5 w-5 transition-transform", !open && "-rotate-90")} />
            </button>
          )}
          <Toggle checked={link.active} onChange={(v) => updateLink(uid, link.id, { active: v }).catch(() => toast.error("Couldn't update."))} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {kind === "link" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-500">
                <LuMousePointerClick className="h-3.5 w-3.5" /> {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
              </span>
            )}
            {isGroup && onAddChild && (
              <Button size="sm" variant="secondary" onClick={onAddChild}>
                <LuPlus /> Add link
              </Button>
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
                <span className="mr-1 text-xs font-semibold text-zinc-500">{isGroup ? "Delete group? Links are kept." : "Delete?"}</span>
                <Button size="sm" variant="danger" onClick={() => onDelete().then(() => toast.success("Deleted")).catch(() => toast.error("Couldn't delete."))}>
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
                    aria-label={`Edit ${title}`}
                  >
                    {editing ? <LuX /> : <LuPencil />}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="hover:!bg-rose-50 hover:!text-rose-600" onClick={() => setConfirm(true)} aria-label={`Delete ${title}`}>
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

        {isGroup && open && body}
      </motion.div>
    </div>
  );
}

/** Drop target + sortable list for the links inside one group. */
function GroupBody({ groupId, ids, children }: { groupId: string; ids: string[]; children: ReactNode }) {
  const key = `c:${groupId}`;
  const { setNodeRef, isOver } = useDroppable({ id: key });
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} data-group-body={groupId} className={cn("mt-3 min-h-16 space-y-3 rounded-2xl border-2 border-dashed p-2.5 transition-colors", isOver ? "border-violet-400 bg-violet-50" : "border-zinc-200 bg-zinc-50/60")}>
        <AnimatePresence initial={false}>{children}</AnimatePresence>
        {ids.length === 0 && <p className="py-3 text-center text-xs font-semibold text-zinc-400">Drag links here, or press “Add link”</p>}
      </div>
    </SortableContext>
  );
}

function RootEnd({ show }: { show: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT });
  return (
    <div ref={setNodeRef} className={cn("rounded-2xl border-2 border-dashed text-center text-xs font-semibold transition-all", show ? "mt-3 flex h-14 items-center justify-center" : "h-1 border-transparent", show && (isOver ? "border-violet-400 bg-violet-50 text-violet-600" : "border-zinc-200 text-zinc-400"))}>
      {show && "Drop here to place at the top level"}
    </div>
  );
}

function OverlayCard({ link, childCount }: { link: LinkItem; childCount: number }) {
  const { tile, title, sub, tileStyle } = describe(link, childCount);
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-violet-300 bg-white p-3.5 shadow-2xl shadow-violet-500/30">
      <LuGripVertical className="h-5 w-5 text-violet-400" />
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl", !tileStyle && "bg-brand-soft text-violet-600")} style={tileStyle}>
        {tile}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold">{title}</p>
        <p className="truncate text-xs font-medium text-zinc-400">{sub}</p>
      </div>
    </div>
  );
}

export default function LinksPanel({ uid, links }: { uid: string; links: LinkItem[] }) {
  const [form, setForm] = useState<{ kind: ItemKind; groupId: string | null } | null>(null);
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Local tree used while dragging and until Firestore echoes the new order back (ignored once `links` changes).
  const [override, setOverride] = useState<{ tree: Tree; base: LinkItem[] } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  const byId = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);
  const derived = useMemo(() => buildTree(links), [links]);
  const tree = override && override.base === links ? override.tree : derived;

  useEffect(() => {
    if (form) formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [form]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collision = useCallback<CollisionDetection>(
    (args) => {
      if (byId.get(String(args.active.id))?.kind === "group") {
        // Groups only move among top-level items.
        const root = new Set(tree[ROOT]);
        return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => root.has(String(c.id)) || c.id === ROOT) });
      }
      const hits = pointerWithin(args);
      return hits.length ? hits : closestCenter(args);
    },
    [byId, tree],
  );

  async function create(kind: ItemKind, groupId: string | null, f: Fields) {
    const err = validateFields(kind, f);
    if (err) return toast.error(err);
    setBusy(true);
    try {
      const siblings = links.filter((l) => (groupId ? l.groupId === groupId : !l.groupId || !byId.has(l.groupId)));
      const top = Math.min(0, ...siblings.map((l) => l.order));
      await addLink(
        uid,
        {
          kind,
          groupId,
          title: f.title.trim(),
          url: kind === "link" ? normalizeUrl(f.url) : f.url.trim(),
          iconType: f.iconType,
          emoji: f.emoji,
          thumbnail: f.thumbnail,
          startAt: f.startAt,
          endAt: f.endAt,
          collapsible: f.collapsible,
          gradFrom: f.gradFrom,
          gradTo: f.gradTo,
        },
        top,
      );
      setFields(EMPTY_FIELDS);
      setForm(null);
      toast.success("Added");
    } catch {
      toast.error("Couldn't add. Check your Firestore rules.");
    } finally {
      setBusy(false);
    }
  }

  function startAdd(kind: ItemKind, groupId: string | null = null) {
    setFields(EMPTY_FIELDS);
    if (kind === "divider") void create(kind, groupId, EMPTY_FIELDS);
    else setForm({ kind, groupId });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form) void create(form.kind, form.groupId, fields);
  }

  async function remove(link: LinkItem) {
    if (link.kind === "group") {
      await deleteGroup(uid, link, tree[`c:${link.id}`].map((id) => byId.get(id)!).filter(Boolean));
    } else {
      await deleteLink(uid, link.id);
    }
  }

  /* ----- drag & drop ----- */

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setOverride({ tree: derived, base: links });
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    if (activeKey === overKey || byId.get(activeKey)?.kind === "group") return;

    setOverride((o) => {
      const cur = o && o.base === links ? o.tree : derived;
      const from = findContainer(cur, activeKey);
      const to = overKey.startsWith("c:") ? overKey : findContainer(cur, overKey);
      if (!from || !to || from === to || !cur[to]) return o;

      const target = cur[to];
      let index = target.length;
      if (!overKey.startsWith("c:")) {
        const translated = active.rect.current.translated;
        const below = !!translated && translated.top > over.rect.top + over.rect.height / 2;
        index = target.indexOf(overKey) + (below ? 1 : 0);
      }
      return {
        base: links,
        tree: {
          ...cur,
          [from]: cur[from].filter((id) => id !== activeKey),
          [to]: [...target.slice(0, index), activeKey, ...target.slice(index)],
        },
      };
    });
  }

  function persist(next: Tree) {
    const updates: Array<{ id: string; order: number; groupId: string | null }> = [];
    for (const [key, ids] of Object.entries(next)) {
      const groupId = key === ROOT ? null : key.slice(2);
      ids.forEach((id, i) => {
        const it = byId.get(id);
        if (it && (it.order !== i || (it.groupId ?? null) !== groupId)) updates.push({ id, order: i, groupId });
      });
    }
    if (updates.length === 0) return setOverride(null);
    setOverride({ tree: next, base: links });
    moveItems(uid, updates).catch(() => {
      toast.error("Couldn't save the new order.");
      setOverride(null);
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const activeKey = String(active.id);
    setActiveId(null);
    if (!over) return setOverride(null);
    const overKey = String(over.id);
    let next = tree;

    if (byId.get(activeKey)?.kind === "group") {
      // Resolve whatever we hovered to a top-level target.
      let target = overKey === ROOT ? "" : overKey;
      if (overKey.startsWith("c:") && overKey !== ROOT) target = overKey.slice(2);
      else if (!overKey.startsWith("c:")) {
        const c = findContainer(tree, overKey);
        if (c && c !== ROOT) target = c.slice(2);
      }
      const root = tree[ROOT];
      const from = root.indexOf(activeKey);
      const to = target ? root.indexOf(target) : root.length - 1;
      if (from >= 0 && to >= 0 && from !== to) next = { ...tree, [ROOT]: arrayMove(root, from, to) };
    } else {
      const from = findContainer(tree, activeKey);
      const to = overKey.startsWith("c:") ? overKey : findContainer(tree, overKey);
      if (from && to && from === to) {
        const list = tree[from];
        const a = list.indexOf(activeKey);
        const b = overKey.startsWith("c:") ? list.length - 1 : list.indexOf(overKey);
        if (a >= 0 && b >= 0 && a !== b) next = { ...tree, [from]: arrayMove(list, a, b) };
      }
    }
    persist(next);
  }

  const activeLink = activeId ? byId.get(activeId) : undefined;
  const groupTitle = form?.groupId ? byId.get(form.groupId)?.title : null;

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {ADD_OPTIONS.map(({ kind: k, label, Icon }) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.95 }}
            onClick={() => startAdd(k)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border bg-white py-3 text-[11px] font-bold shadow-sm transition sm:text-xs",
              form && form.kind === k && !form.groupId ? "border-violet-400 text-violet-700 ring-4 ring-violet-500/10" : "border-zinc-100 text-zinc-600 hover:border-violet-200 hover:text-violet-700",
              k === "link" && !form && "bg-brand border-transparent !text-white shadow-lg shadow-fuchsia-500/25",
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

      <div ref={formRef}>
        <AnimatePresence initial={false}>
          {form && (
            <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
              <div className="rounded-3xl border border-violet-100 bg-white p-4 shadow-lg shadow-violet-500/10 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base font-bold capitalize">
                    New {form.kind}
                    {groupTitle ? <span className="font-semibold normal-case text-zinc-400"> in “{groupTitle}”</span> : null}
                  </h3>
                  <button type="button" onClick={() => setForm(null)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
                    <LuX />
                  </button>
                </div>
                <ItemForm uid={uid} kind={form.kind} value={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} />
                <Button type="submit" loading={busy} className="mt-3 w-full">
                  Add {form.kind}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5">
        <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => (setActiveId(null), setOverride(null))}>
          <SortableContext items={tree[ROOT]} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {tree[ROOT].map((id) => {
                  const link = byId.get(id);
                  if (!link) return null;
                  if (link.kind !== "group") return <ItemCard key={id} link={link} uid={uid} now={now} onDelete={() => remove(link)} />;
                  const kidIds = tree[`c:${id}`] ?? [];
                  return (
                    <ItemCard
                      key={id}
                      link={link}
                      uid={uid}
                      now={now}
                      childCount={kidIds.length}
                      onAddChild={() => startAdd("link", id)}
                      onDelete={() => remove(link)}
                      body={
                        <GroupBody groupId={id} ids={kidIds}>
                          {kidIds.map((kid) => {
                            const child = byId.get(kid);
                            return child ? <ItemCard key={kid} link={child} uid={uid} now={now} onDelete={() => remove(child)} /> : null;
                          })}
                        </GroupBody>
                      }
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </SortableContext>
          <RootEnd show={activeId !== null && byId.get(activeId)?.kind !== "group"} />
          <DragOverlay dropAnimation={{ duration: 180 }}>{activeLink ? <OverlayCard link={activeLink} childCount={(tree[`c:${activeLink.id}`] ?? []).length} /> : null}</DragOverlay>
        </DndContext>

        {links.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border-2 border-dashed border-zinc-200 px-6 py-14 text-center">
            <div className="bg-brand-soft mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-violet-600">
              <LuPlus className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display text-lg font-bold">Your page is empty</p>
            <p className="mt-1 text-sm text-zinc-500">Add your first link, group or embed to bring it to life.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
