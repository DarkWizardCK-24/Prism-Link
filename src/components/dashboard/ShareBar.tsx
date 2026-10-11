"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import toast from "react-hot-toast";
import { LuCopy, LuExternalLink, LuQrCode, LuX } from "react-icons/lu";
import { profileUrl } from "@/lib/utils";
import Button from "../ui/Button";

export default function ShareBar({ username }: { username: string }) {
  const [qr, setQr] = useState(false);
  const url = profileUrl(username);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy — select it manually.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white p-1.5 pl-4 shadow-sm">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-600">
          <span className="text-zinc-400">{url.replace(/^https?:\/\//, "").replace(username, "")}</span>
          <span className="text-gradient font-bold">{username}</span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => setQr(true)} aria-label="Show QR code">
          <LuQrCode />
        </Button>
        <a href={`/${username}`} target="_blank" rel="noreferrer" aria-label="Open page" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100">
          <LuExternalLink />
        </a>
        <Button size="sm" onClick={copy}>
          <LuCopy /> Copy
        </Button>
      </div>

      <AnimatePresence>
        {qr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-6 backdrop-blur-sm" onClick={() => setQr(false)}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xs rounded-[2rem] bg-white p-7 text-center shadow-2xl">
              <button onClick={() => setQr(false)} className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
                <LuX />
              </button>
              <h3 className="font-display text-lg font-bold">Scan to visit</h3>
              <div className="mx-auto mt-4 w-fit rounded-3xl bg-brand-soft p-4">
                <QRCodeSVG value={url} size={190} fgColor="#4c1d95" bgColor="transparent" level="M" />
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-zinc-500">{url.replace(/^https?:\/\//, "")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
