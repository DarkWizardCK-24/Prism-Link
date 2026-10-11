"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LuChartColumn, LuEye, LuLink, LuLoaderCircle, LuLogOut, LuPalette, LuSettings, LuX } from "react-icons/lu";
import type { IconType } from "react-icons";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import AppearancePanel, { type Draft } from "@/components/dashboard/AppearancePanel";
import LinksPanel from "@/components/dashboard/LinksPanel";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ShareBar from "@/components/dashboard/ShareBar";
import PhonePreview from "@/components/PhonePreview";
import ProfileView from "@/components/ProfileView";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import SetupNotice from "@/components/ui/SetupNotice";
import { useAuth } from "@/context/AuthContext";
import { subscribeLinks, subscribeProfile, updateProfile } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { LinkItem, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "links" | "appearance" | "analytics" | "settings";

const TABS: Array<{ id: Tab; label: string; Icon: IconType }> = [
  { id: "links", label: "Links", Icon: LuLink },
  { id: "appearance", label: "Appearance", Icon: LuPalette },
  { id: "analytics", label: "Analytics", Icon: LuChartColumn },
  { id: "settings", label: "Settings", Icon: LuSettings },
];

const TITLES: Record<Tab, string> = {
  links: "Your links",
  appearance: "Appearance",
  analytics: "Analytics",
  settings: "Settings",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("links");
  const [previewOpen, setPreviewOpen] = useState(false);
  // Unsaved edits that the live preview shows straight away.
  const [linkDrafts, setLinkDrafts] = useState<Record<string, Partial<LinkItem>>>({});
  const [newItem, setNewItem] = useState<LinkItem | null>(null);
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);

  const onLinkDraft = useCallback((id: string, patch: Partial<LinkItem> | null) => {
    setLinkDrafts((d) => {
      if (patch) return { ...d, [id]: patch };
      if (!(id in d)) return d;
      const next = { ...d };
      delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const offProfile = subscribeProfile(user.uid, setProfile);
    const offLinks = subscribeLinks(user.uid, setLinks);
    return () => {
      offProfile();
      offLinks();
    };
  }, [user]);

  const merged = useMemo(() => (profile ? { ...profile, ...draft } : null), [profile, draft]);
  const previewProfile = useMemo(() => (merged && usernameDraft ? { ...merged, username: usernameDraft } : merged), [merged, usernameDraft]);
  const previewLinks = useMemo(() => {
    const edited = links.map((l) => (linkDrafts[l.id] ? { ...l, ...linkDrafts[l.id] } : l));
    return newItem ? [...edited, newItem] : edited;
  }, [links, linkDrafts, newItem]);
  const dirty = Object.keys(draft).length > 0;

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.uid, draft);
      setDraft({});
      toast.success("Saved!");
    } catch {
      toast.error("Couldn't save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="aurora-bg flex min-h-dvh items-center justify-center p-5">
        <SetupNotice />
      </div>
    );
  }

  if (loading || !user || !profile || !merged) {
    return (
      <div className="aurora-bg flex min-h-dvh flex-col items-center justify-center gap-4">
        <LuLoaderCircle className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-sm font-semibold text-zinc-500">Loading your prism…</p>
      </div>
    );
  }

  return (
    <div className="aurora-bg min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_25rem]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-white/60 bg-white/50 p-5 backdrop-blur-xl lg:flex">
        <Logo href="/dashboard" />
        <nav className="mt-9 space-y-1.5">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={cn("relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors", tab === id ? "text-white" : "text-zinc-500 hover:bg-white hover:text-zinc-800")}>
              {tab === id && <motion.span layoutId="side-pill" className="bg-brand absolute inset-0 rounded-2xl shadow-lg shadow-fuchsia-500/30" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <Icon className="relative h-5 w-5" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-3xl border border-white bg-white/80 p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar url={merged.avatarUrl} name={merged.displayName || merged.username} className="h-10 w-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{profile.displayName}</p>
              <p className="truncate text-xs font-medium text-zinc-400">@{profile.username}</p>
            </div>
          </div>
          <button onClick={() => logout()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600">
            <LuLogOut /> Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <main className="min-w-0 px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="mx-auto mb-5 flex max-w-2xl items-center justify-between lg:hidden">
          <Logo href="/dashboard" />
          <button onClick={() => setPreviewOpen(true)} className="bg-brand flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 active:scale-95" aria-label="Preview page">
            <LuEye /> Preview
          </button>
        </header>

        <div className="mx-auto max-w-2xl">
          <ShareBar username={profile.username} />
          <h1 className="mb-4 mt-7 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{TITLES[tab]}</h1>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "links" && <LinksPanel uid={user.uid} links={links} onLinkDraft={onLinkDraft} onNewDraft={setNewItem} />}
              {tab === "appearance" && (
                <AppearancePanel
                  value={merged}
                  onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
                  dirty={dirty}
                  saving={saving}
                  onSave={save}
                  onReset={() => setDraft({})}
                />
              )}
              {tab === "analytics" && <AnalyticsPanel profile={profile} links={links} />}
              {tab === "settings" && <SettingsPanel profile={profile} onUsernameDraft={setUsernameDraft} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Desktop live preview */}
      <aside className="sticky top-0 hidden h-dvh flex-col items-center justify-center border-l border-white/60 bg-white/30 p-6 lg:flex">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Live preview</p>
        <PhonePreview profile={previewProfile ?? merged} links={previewLinks} />
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="safe-bottom glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-1 pt-1.5">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className="relative flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold" aria-current={tab === id}>
              {tab === id && <motion.span layoutId="tab-pill" className="bg-brand-soft absolute inset-x-3 inset-y-0.5 rounded-2xl" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <Icon className={cn("relative h-5 w-5 transition-colors", tab === id ? "text-violet-600" : "text-zinc-400")} />
              <span className={cn("relative", tab === id ? "text-violet-700" : "text-zinc-400")}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile full-screen preview */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="fixed inset-0 z-50 overflow-y-auto lg:hidden">
            <ProfileView profile={previewProfile ?? merged} links={previewLinks} preview className="min-h-dvh" />
            <button onClick={() => setPreviewOpen(false)} className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur" aria-label="Close preview">
              <LuX className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
