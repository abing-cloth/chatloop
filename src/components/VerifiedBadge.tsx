import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className="inline-block shrink-0 fill-sky-500 text-white"
      aria-label="Akun terverifikasi"
    />
  );
}
