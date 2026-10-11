"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  LuArrowRight,
  LuChartColumn,
  LuGripVertical,
  LuPalette,
  LuQrCode,
  LuSmartphone,
  LuSparkles,
  LuZap,
} from "react-icons/lu";
import { FaGithub, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa6";
import PhonePreview from "@/components/PhonePreview";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

const DEMO_LINKS = [
  { id: "1", title: "Watch my new video", url: "youtube.com/@mia", active: true },
  { id: "2", title: "Follow on Instagram", url: "instagram.com/mia", active: true },
  { id: "3", title: "Listen on Spotify", url: "open.spotify.com/mia", active: true },
  { id: "4", title: "My portfolio", url: "mia.design", active: true },
  { id: "5", title: "Open source on GitHub", url: "github.com/mia", active: true },
];

const FEATURES = [
  { Icon: LuPalette, title: "Gorgeous themes", text: "Eight hand-tuned gradient themes with glass, solid and outline buttons.", tint: "from-violet-500 to-fuchsia-500" },
  { Icon: LuGripVertical, title: "Drag & drop", text: "Reorder links with a flick. Toggle any link on or off instantly.", tint: "from-pink-500 to-orange-400" },
  { Icon: LuChartColumn, title: "Live analytics", text: "See page views, clicks and your top performing links in real time.", tint: "from-sky-500 to-indigo-500" },
  { Icon: LuQrCode, title: "Share anywhere", text: "One short URL plus an instant QR code for print and events.", tint: "from-emerald-500 to-teal-500" },
  { Icon: LuSmartphone, title: "App-like on mobile", text: "Built mobile-first with a native feel — and a full studio on desktop.", tint: "from-amber-500 to-rose-500" },
  { Icon: LuZap, title: "Blazing fast", text: "Powered by Next.js and Firebase so your page loads in a blink.", tint: "from-fuchsia-500 to-purple-600" },
];

const STEPS = [
  { n: "01", title: "Claim your link", text: "Sign up and pick a username — prismlink.app/you." },
  { n: "02", title: "Add & style", text: "Drop in your links, choose a theme and watch the preview update live." },
  { n: "03", title: "Share everywhere", text: "Put it in your bio, your videos, your business card." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="aurora-bg overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-white/70">
                Log in
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="text-center lg:text-left">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
            <LuSparkles /> Your link-in-bio, reimagined
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl 2xl:text-7xl">
            One link.
            <br />
            <span className="text-gradient animate-shimmer">Every side of you.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 lg:mx-0">
            PrismLink splits your online world into a single, beautiful page. Share your socials, music, store and
            more — styled your way in minutes.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link href={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Create your PrismLink <LuArrowRight />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full">
                I have an account
              </Button>
            </Link>
          </motion.div>
          <p className="mt-5 text-sm font-medium text-zinc-400">Free forever · No credit card</p>
        </div>

        <div className="relative mx-auto">
          <div className="animate-blob absolute -left-10 top-10 h-64 w-64 rounded-full bg-violet-400/40 blur-3xl" />
          <div className="animate-blob absolute -right-6 bottom-0 h-64 w-64 rounded-full bg-pink-400/40 blur-3xl [animation-delay:-7s]" />
          <motion.div initial={{ opacity: 0, y: 40, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 16 }} className="animate-float relative">
            <PhonePreview
              profile={{ username: "mia", displayName: "Mia Rivera", bio: "Creator · Designer · Dreamer ✨", avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Mia&backgroundType=gradientLinear&backgroundColor=ffd5dc", theme: "aurora", buttonStyle: "glass", buttonShape: "pill" }}
              links={DEMO_LINKS}
            />
          </motion.div>
          {[
            { Icon: FaInstagram, cls: "-left-8 top-24 text-pink-500", d: "animate-float-slow" },
            { Icon: FaYoutube, cls: "-right-8 top-44 text-red-500", d: "animate-float" },
            { Icon: FaSpotify, cls: "-left-6 bottom-32 text-emerald-500", d: "animate-float" },
            { Icon: FaGithub, cls: "-right-6 bottom-16 text-zinc-800", d: "animate-float-slow" },
          ].map(({ Icon, cls, d }, i) => (
            <div key={i} className={`absolute hidden h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl shadow-violet-500/20 sm:flex ${cls} ${d}`}>
              <Icon className="h-6 w-6" />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need, <span className="text-gradient">nothing you don&apos;t</span>
          </h2>
          <p className="mt-3 text-zinc-500">Simple to start. Delightful to use. Beautiful to share.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text, tint }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.07 }} whileHover={{ y: -6 }} className="glass rounded-3xl p-6 shadow-lg shadow-violet-500/5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tint}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Live in three steps</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-100">
              <span className="text-gradient font-display text-5xl font-extrabold">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1.5 text-zinc-500">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="bg-brand animate-shimmer relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white shadow-2xl shadow-fuchsia-500/30">
          <div className="animate-blob absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to light up your link?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/85">Join in seconds. Your first page is on us.</p>
          <Link href="/signup" className="relative mt-8 inline-block">
            <Button size="lg" variant="secondary" className="!text-violet-700">
              Get started free <LuArrowRight />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/70 py-8 text-center text-sm font-medium text-zinc-400">
        © {new Date().getFullYear()} PrismLink · Built with Next.js &amp; Firebase
      </footer>
    </div>
  );
}
