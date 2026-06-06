import { CreatePost } from "../components/CreatePost";
import { PostCard } from "../components/PostCard";
import { Stories } from "../components/Stories";
import { InstallBanner } from "../components/InstallBanner";
import { useStore } from "../lib/store";
import { useT } from "../lib/i18n";

export function Feed() {
  const allPosts = useStore((s) => s.posts);
  const blocked = useStore((s) => s.blockedIds);
  const user = useStore((s) => s.user);
  const posts = allPosts.filter((p) => !blocked.includes(p.userId) && !user(p.userId).banned);
  const tr = useT();

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <Stories />
      <InstallBanner />
      <CreatePost />
      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          {tr("post.empty")}
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
