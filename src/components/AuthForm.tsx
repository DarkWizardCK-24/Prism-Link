"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { LuAtSign, LuEye, LuEyeOff, LuLock, LuMail, LuUser } from "react-icons/lu";
import { authErrorMessage, useAuth } from "@/context/AuthContext";
import { createAccount } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import Button from "./ui/Button";
import Logo from "./ui/Logo";
import SetupNotice from "./ui/SetupNotice";
import ProfileView from "./ProfileView";

type Mode = "login" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: "Welcome back", sub: "Log in to manage your links.", cta: "Log in" },
  signup: { title: "Create your page", sub: "Claim your link in under a minute.", cta: "Create account" },
  forgot: { title: "Reset password", sub: "We'll email you a reset link.", cta: "Send reset link" },
};

function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <label className="group relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-violet-600">
        {icon}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-[15px] font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { user, loading, login, resetPassword } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else if (mode === "signup") {
        await createAccount({ email: email.trim(), password, username: username.trim(), displayName });
        toast.success("Welcome to PrismLink!");
      } else {
        await resetPassword(email.trim());
        toast.success("Reset link sent — check your inbox.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="relative hidden overflow-hidden bg-[#120d2b] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="animate-blob absolute -left-20 top-10 h-96 w-96 rounded-full bg-violet-600/40 blur-3xl" />
        <div className="animate-blob absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-pink-500/40 blur-3xl [animation-delay:-8s]" />
        <div className="absolute left-10 top-10">
          <Logo light />
        </div>
        <div className="animate-float relative z-10 h-[560px] w-[290px] overflow-hidden rounded-[2.8rem] border-[10px] border-zinc-900 shadow-2xl">
          <ProfileView
            preview
            className="min-h-full"
            profile={{ username: "luna", displayName: "Luna Park", bio: "Designer • Creator • Coffee lover ☕", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Luna&backgroundColor=ffd5dc", theme: "sunset", buttonStyle: "glass", buttonShape: "pill" }}
            links={[
              { id: "1", title: "My latest video", url: "youtube.com/luna", active: true },
              { id: "2", title: "Portfolio", url: "luna.design", active: true },
              { id: "3", title: "Follow on Instagram", url: "instagram.com/luna", active: true },
            ]}
          />
        </div>
        <p className="relative z-10 mt-10 max-w-sm text-center font-display text-2xl font-bold leading-snug text-white">
          One link.<br />
          <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">Every side of you.</span>
        </p>
      </div>

      {/* Form panel */}
      <div className="aurora-bg flex flex-col px-5 py-6 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="glass w-full max-w-md rounded-[2rem] p-6 shadow-xl shadow-violet-500/10 sm:p-9"
          >
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{copy.title}</h1>
            <p className="mt-1.5 text-[15px] text-zinc-500">{copy.sub}</p>

            {!isFirebaseConfigured ? (
              <SetupNotice />
            ) : (
              <form onSubmit={onSubmit} className="mt-7 space-y-3.5">
                {mode === "signup" && (
                  <>
                    <Field icon={<LuUser />}>
                      <input className={inputCls} placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={50} autoComplete="name" />
                    </Field>
                    <Field icon={<LuAtSign />}>
                      <input
                        className={inputCls}
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                        required
                        minLength={3}
                        maxLength={24}
                        autoComplete="username"
                      />
                    </Field>
                  </>
                )}
                <Field icon={<LuMail />}>
                  <input className={inputCls} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </Field>
                {mode !== "forgot" && (
                  <Field icon={<LuLock />}>
                    <input
                      className={`${inputCls} pr-12`}
                      type={show ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 hover:text-zinc-700" aria-label={show ? "Hide password" : "Show password"}>
                      {show ? <LuEyeOff /> : <LuEye />}
                    </button>
                  </Field>
                )}

                {mode === "signup" && username && (
                  <p className="px-1 text-xs font-medium text-zinc-500">
                    Your page: <span className="font-bold text-violet-600">prismlink.app/{username}</span>
                  </p>
                )}
                {mode === "login" && (
                  <div className="text-right">
                    <Link href="/forgot" className="text-sm font-semibold text-violet-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600">
                    {error}
                  </motion.p>
                )}

                <Button type="submit" size="lg" loading={busy} className="w-full">
                  {copy.cta}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-zinc-500">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link href="/signup" className="font-bold text-violet-600 hover:underline">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-violet-600 hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
