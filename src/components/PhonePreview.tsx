"use client";

import type { ComponentProps } from "react";
import ProfileView from "./ProfileView";

export default function PhonePreview(props: Omit<ComponentProps<typeof ProfileView>, "preview" | "className">) {
  return (
    <div className="relative mx-auto h-[640px] w-[310px] rounded-[3rem] bg-zinc-900 p-3 shadow-2xl shadow-violet-900/30 ring-1 ring-white/10">
      <div className="absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
      <div className="h-full w-full overflow-y-auto overflow-x-hidden rounded-[2.4rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ProfileView {...props} preview className="min-h-full" />
      </div>
    </div>
  );
}
