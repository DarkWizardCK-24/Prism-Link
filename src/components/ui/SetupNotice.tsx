import { LuFlame } from "react-icons/lu";

export default function SetupNotice() {
  return (
    <div className="mx-auto my-10 w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <div className="flex items-center gap-2 font-display text-lg font-bold">
        <LuFlame className="h-5 w-5" /> Firebase isn&apos;t configured yet
      </div>
      <p className="mt-2 text-sm leading-relaxed">
        Copy <code className="rounded bg-amber-100 px-1.5 py-0.5">.env.local.example</code> to{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5">.env.local</code>, paste your Firebase web app keys, enable
        Email/Password sign-in and create a Firestore database, then restart the dev server. See the README for the
        full walkthrough.
      </p>
    </div>
  );
}
