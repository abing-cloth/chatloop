import { useState } from "react";
import { Heart, MessageCircle, Search } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { useStore } from "../lib/store";
import type { Post } from "../lib/types";

export function Explore() {
  const posts = useStore((s) => s.posts);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Post | null>(null);

  const photos = posts.filter((p) => p.image);
  const filtered = query.trim()
    ? photos.filter((p) => p.text.toLowerCase().includes(query.toLowerCase()))
    : photos;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari postingan..."
          className="w-full rounded-full border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <h2 className="px-1 text-lg font-bold">Jelajahi</h2>

      {filtered.length === 0 ? (
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
