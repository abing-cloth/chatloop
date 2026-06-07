import { useState } from "react";
import { Heart, MessageCircle, Search, Store, UserRound } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { useStore } from "../lib/store";
import { useT } from "../lib/i18n";
import { formatRupiah } from "../lib/utils";
import type { Post } from "../lib/types";

export function Explore() {
  const tr = useT();
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);
  const products = useStore((s) => s.products);
  const me = useStore((s) => s.currentUserId);
  const openProfile = useStore((s) => s.openProfile);
  const navigate = useStore((s) => s.navigate);
  const user = useStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Post | null>(null);

  const q = query.trim().toLowerCase();
  const photos = posts.filter((p) => p.image);
  const filtered = q ? photos.filter((p) => p.text.toLowerCase().includes(q)) : photos;

  // cari TEMAN (nama/username) & TOKO/PRODUK (nama produk/penjual)
  const foundUsers = q ? users.filter((u) => u.id !== me && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))).slice(0, 12) : [];
  const foundProducts = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || user(p.sellerId).name.toLowerCase().includes(q)).slice(0, 12)
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari teman, toko online, atau postingan..."
          className="w-full rounded-full border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      {/* hasil: teman */}
      {foundUsers.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold"><UserRound size={15} /> Teman</h3>
          <div className="space-y-1.5">
            {foundUsers.map((u) => (
              <button key={u.id} onClick={() => openProfile(u.id)} className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <img src={u.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold">{u.name} {u.verified && <VerifiedBadge size={13} />}</p>
                  <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* hasil: toko & produk */}
      {foundProducts.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold"><Store size={15} /> Toko & Produk</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {foundProducts.map((p) => (
              <button key={p.id} onClick={() => navigate("shop")} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left dark:border-zinc-800 dark:bg-zinc-900">
                <img src={p.image} alt="" className="aspect-square w-full object-cover" />
                <div className="p-2.5">
                  <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="truncate text-[11px] text-zinc-500">{user(p.sellerId).name}</p>
                  <p className="mt-0.5 font-bold text-fuchsia-600 dark:text-fuchsia-400">{formatRupiah(p.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="px-1 text-lg font-bold">{tr("page.explore")}</h2>

      {filtered.length === 0 && foundUsers.length === 0 && foundProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Tidak ada hasil untuk "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpen(p)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
            >
              <img
                src={p.image}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Heart size={18} className="fill-white" /> {p.likedBy.length}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <MessageCircle size={18} className="fill-white" /> {p.comments.length}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* modal lihat postingan */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
          onClick={() => setOpen(null)}
        >
          <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <PostCard post={open} />
          </div>
        </div>
      )}
    </div>
  );
}
