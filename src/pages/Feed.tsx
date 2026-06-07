import { Radio } from "lucide-react";
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
  // beranda global: SEMUA postingan dari semua pengguna, terbaru di atas
  const posts = allPosts
    .filter((p) => !blocked.includes(p.userId) && !user(p.userId).banned)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  const tr = useT();

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <Stories />
      <LiveRail />
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

// Rail "Live sekarang" — siaran semua pengguna tampil di beranda semua orang
function LiveRail() {
  const lives = useStore((s) => s.liveStreams);
  const blocked = useStore((s) => s.blockedIds);
  const user = useStore((s) => s.user);
  const navigate = useStore((s) => s.navigate);
  const list = lives.filter((l) => !blocked.includes(l.userId) && !user(l.userId).banned);
  if (list.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold">
        <Radio size={16} className="text-red-500" /> Live sekarang
        <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-400">{list.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((l) => {
          const u = user(l.userId);
          return (
            <button key={l.id} onClick={() => navigate("live")} className="group relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-200 text-left dark:bg-zinc-800">
              <img src={l.thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                <span className="h-1 w-1 rounded-full bg-white animate-live-dot" /> LIVE
              </span>
              <div className="absolute inset-x-0 bottom-0 p-1.5">
                <div className="flex items-center gap-1">
                  <img src={u.avatar} alt="" className="h-4 w-4 rounded-full border border-white/60 object-cover" />
                  <span className="truncate text-[10px] font-semibold text-white">{u.name}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
