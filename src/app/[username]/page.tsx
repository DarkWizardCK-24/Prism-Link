"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuLoaderCircle } from "react-icons/lu";
import ProfileView from "@/components/ProfileView";
import Button from "@/components/ui/Button";
import SetupNotice from "@/components/ui/SetupNotice";
import { getPublicPage, trackClick, trackView } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { LinkItem, Profile } from "@/lib/types";

type State = { status: "loading" } | { status: "missing" } | { status: "ready"; profile: Profile; links: LinkItem[] };

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    getPublicPage(decodeURIComponent(username))
      .then((page) => {
        if (cancelled) return;
        if (!page) return setState({ status: "missing" });
        setState({ status: "ready", ...page });
        document.title = `${page.profile.displayName || page.profile.username} | PrismLink`;
        // Count one view per browser session.
        try {
          const key = `pl-view-${page.profile.uid}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            trackView(page.profile.uid);
          }
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => !cancelled && setState({ status: "missing" }));
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!isFirebaseConfigured) {
    return (
      <div className="aurora-bg flex min-h-dvh items-center justify-center p-5">
        <SetupNotice />
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#120d2b]">
        <LuLoaderCircle className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="aurora-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gradient font-display text-7xl font-extrabold">404</p>
        <h1 className="font-display text-2xl font-bold">This page doesn&apos;t exist (yet)</h1>
        <p className="max-w-sm text-zinc-500">
          <span className="font-bold text-zinc-700">@{username}</span> is available — claim it before someone else does.
        </p>
        <Link href="/signup">
          <Button size="lg">Claim this username</Button>
        </Link>
      </div>
    );
  }

  const { profile, links } = state;
  return <ProfileView profile={profile} links={links} className="min-h-dvh" onLinkClick={(id) => trackClick(profile.uid, id)} />;
}
