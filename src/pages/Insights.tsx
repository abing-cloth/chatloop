import { BarChart3, Eye, Heart, MessageCircle, Package, Play, UserPlus } from "lucide-react";
import { useStore } from "../lib/store";
import { formatRupiah } from "../lib/utils";

export function Insights() {
  const me = useStore((s) => s.me());
  const posts = useStore((s) => s.posts.filter((p) => p.userId === me.id));
  const reels = useStore((s) => s.reels.filter((r) => r.userId === me.id));
  const products = useStore((s) => s.products.filter((p) => p.sellerId === me.id));
  const followers = useStore((s) => s.followerCount(me.id));
  const earnings = useStore((s) => s.walletTx.filter((t) => t.type === "penjualan").reduce((n, t) => n + t.amount, 0));

  const totalLikes = posts.reduce((n, p) => n + p.likedBy.length, 0) + reels.reduce((n, r) => n + r.likedBy.length, 0);
  const totalComments = posts.reduce((n, p) => n + p.comments.length, 0);
  const profileVisits = Math.round(followers * 1.8 + totalLikes * 3 + 42);

  // grafik suka per postingan terbaru
  const recent = posts.slice(0, 6);
  const maxLikes = Math.max(1, ...recent.map((p) => p.likedBy.length));

  const cards = [
    { icon: UserPlus, label: "Pengikut", value: followers.toLocaleString("id-ID"), color: "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40" },
    { icon: Eye, label: "Kunjungan profil", value: profileVisits.toLocaleString("id-ID"), color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
    { icon: Heart, label: "Total suka", value: totalLikes.toLocaleString("id-ID"), color: "text-red-500 bg-red-50 dark:bg-red-950/40" },
    { icon: MessageCircle, label: "Komentar diterima", value: totalComments.toLocaleString("id-ID"), color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { icon: Play, label: "Reels", value: reels.length.toLocaleString("id-ID"), color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
    { icon: Package, label: "Produk dijual", value: products.length.toLocaleString("id-ID"), color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <BarChart3 size={20} className="text-fuchsia-600" /> Insight Akun
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className={`grid h-9 w-9 place-items-center rounded-xl ${c.color}`}><c.icon size={18} /></div>
            <p className="mt-2 text-xl font-extrabold">{c.value}</p>
            <p className="text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-1 text-sm font-semibold">Pendapatan penjualan</p>
        <p className="text-2xl font-extrabold text-emerald-600">{formatRupiah(earnings)}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-semibold">Suka per postingan terbaru</p>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">Belum ada postingan.</p>
        ) : (
          <div className="flex h-40 items-end justify-around gap-2">
            {recent.slice().reverse().map((p, i) => (
              <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-zinc-500">{p.likedBy.length}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-fuchsia-600 to-purple-500 transition-all"
                  style={{ height: `${(p.likedBy.length / maxLikes) * 100}%`, minHeight: 4 }}
                />
                <span className="text-[10px] text-zinc-400">#{recent.length - i}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="px-2 text-center text-xs text-zinc-400">Data insight diperbarui otomatis dari aktivitas akunmu.</p>
    </div>
  );
}
