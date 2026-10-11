/* eslint-disable @next/next/no-img-element */
import { cn, initials } from "@/lib/utils";

export default function Avatar({
  url,
  name,
  className,
}: {
  url?: string;
  name: string;
  className?: string;
}) {
  return url ? (
    <img src={url} alt={name} referrerPolicy="no-referrer" className={cn("rounded-full object-cover", className)} />
  ) : (
    <div
      className={cn(
        "bg-brand flex items-center justify-center rounded-full font-display font-bold text-white",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
