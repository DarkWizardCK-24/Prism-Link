"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuAtSign, LuKeyRound, LuLogOut, LuMail } from "react-icons/lu";
import { authErrorMessage, useAuth } from "@/context/AuthContext";
import { changeUsername } from "@/lib/db";
import type { Profile } from "@/lib/types";
import Button from "../ui/Button";

export default function SettingsPanel({ profile, onUsernameDraft }: { profile: Profile; onUsernameDraft: (name: string | null) => void }) {
  const { user, logout, resetPassword } = useAuth();
  const [name, setName] = useState(profile.username);
  const [busy, setBusy] = useState(false);

  // Show the typed username in the live preview before it is saved.
  useEffect(() => {
    onUsernameDraft(name !== profile.username && name.length >= 3 ? name : null);
    return () => onUsernameDraft(null);
  }, [name, profile.username, onUsernameDraft]);

  async function saveUsername() {
    setBusy(true);
    try {
      await changeUsername(profile.uid, profile.username, name.trim());
      toast.success("Username updated");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 font-display text-base font-bold">Username</h3>
        <div className="relative">
          <LuAtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
            maxLength={24}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">Changing it breaks old links you&apos;ve shared.</p>
        <Button size="sm" className="mt-3" loading={busy} disabled={name === profile.username || name.length < 3} onClick={saveUsername}>
          Update username
        </Button>
      </section>

      <section className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 font-display text-base font-bold">Account</h3>
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-600">
          <LuMail className="text-zinc-400" /> {user?.email}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => user?.email && resetPassword(user.email).then(() => toast.success("Reset email sent")).catch((e) => toast.error(authErrorMessage(e)))}
          >
            <LuKeyRound /> Change password
          </Button>
          <Button size="sm" variant="danger" onClick={() => logout()}>
            <LuLogOut /> Log out
          </Button>
        </div>
      </section>
    </div>
  );
}
