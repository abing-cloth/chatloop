import { CreatePost } from "../components/CreatePost";
import { PostCard } from "../components/PostCard";
import { Stories } from "../components/Stories";
import { useStore } from "../lib/store";

export function Feed() {
  const posts = useStore((s) => s.posts);

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <Stories />
      <CreatePost />
      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Belum ada postingan. Mulai bagikan momenmu! 🔄
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
