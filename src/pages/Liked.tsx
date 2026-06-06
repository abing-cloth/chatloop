import { Heart } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { useStore } from "../lib/store";
import { useT } from "../lib/i18n";

export function Liked() {
  const me = useStore((s) => s.currentUserId);
  const posts = useStore((s) => s.posts.filter((p) => p.likedBy.includes(me)));
  const tr = useT();

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <Heart size={20} className="fill-red-500 text-red-500" /> {tr("nav.liked")}
      </h2>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          {tr("liked.empty")}
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
