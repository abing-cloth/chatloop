import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import type { User } from "../lib/types";

export function ShareModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}${import.meta.env.BASE_URL}?u=${user.username}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(link)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* abaikan */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Profil ${user.name} di SUUCHAT`, text: `Ikuti @${user.username} di SUUCHAT 🔄`, url: link });
      } catch {
        /* dibatalkan */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">Bagikan Profil</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={20} /></button>
        </div>

        <img src={user.avatar} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
        <p className="mt-2 flex items-center justify-center gap-1 font-bold">{user.name} {user.verified && <VerifiedBadge size={15} />}</p>
        <p className="text-sm text-zinc-500">@{user.username}</p>

        <div className="mt-4 inline-block rounded-2xl bg-white p-2 ring-1 ring-zinc-200 dark:ring-zinc-700">
          <img src={qr} alt="QR profil" className="h-44 w-44" />
        </div>
        <p className="mt-2 text-xs text-zinc-400">Pindai QR untuk membuka profil</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
          <span className="flex-1 truncate pl-2 text-left text-xs text-zinc-500">{link}</span>
          <button onClick={copy} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-fuchsia-700 shadow-sm dark:bg-zinc-700 dark:text-fuchsia-300">
            {copied ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin</>}
          </button>
        </div>

        <button onClick={nativeShare} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          <Share2 size={16} /> Bagikan ke...
        </button>
      </div>
    </div>
  );
}
