import { useState } from "react";
import { Ban, CheckCircle2, Search, ShieldAlert, Users } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { VerifiedBadge } from "../components/VerifiedBadge";

export function Admin() {
  const me = useStore((s) => s.me());
  const users = useStore((s) => s.users);
  const banUser = useStore((s) => s.banUser);
  const openProfile = useStore((s) => s.openProfile);
  const [q, setQ] = useState("");

  if (!me.admin) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        <ShieldAlert className="mx-auto mb-2" size={32} />
        Halaman ini hanya untuk pengelola (admin).
      </div>
    );
  }

  const list = users.filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase())
  );
  const banned = users.filter((u) => u.banned).length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <ShieldAlert size={20} className="text-fuchsia-600" /> Panel Admin
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Users size={18} />} label="Pengguna" value={users.length} />
        <Stat icon={<Ban size={18} />} label="Diblokir" value={banned} color="text-red-500" />
        <Stat icon={<CheckCircle2 size={18} />} label="Aktif" value={users.length - banned} color="text-emerald-600" />
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pengguna..." className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {list.map((u) => (
          <div key={u.id} className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800">
            <button onClick={() => openProfile(u.id)}>
              <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-semibold">
                {u.name} {u.verified && <VerifiedBadge size={13} />}
                {u.admin && <span className="rounded bg-fuchsia-100 px-1.5 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">ADMIN</span>}
              </p>
              <p className="truncate text-xs text-zinc-500">@{u.username}</p>
            </div>
            {u.banned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">Diblokir</span>}
            {!u.admin && (
              <button
                onClick={() => banUser(u.id, !u.banned)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  u.banned ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40"
                )}
              >
                {u.banned ? "Pulihkan" : "Blokir"}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="px-2 text-center text-xs text-zinc-400">Pengguna yang diblokir admin: konten & profilnya disembunyikan dari semua pengguna.</p>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={cn("mb-1", color ?? "text-fuchsia-600")}>{icon}</div>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
