import { Bookmark } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { useStore } from "../lib/store";

export function Saved() {
  const savedIds = useStore((s) => s.savedPostIds);
  const posts = useStore((s) => s.posts);

  const saved = savedIds
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <Bookmark size={20} className="text-fuchsia-600" /> Tersimpan
      </h2>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Belum ada postingan tersimpan.
          <br />
          Tekan ikon 🔖 pada postingan untuk menyimpannya.
        </div>
      ) : (
        saved.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
