import { Heart, MessageCircle, Radio, UserPlus } from "lucide-react";
import { useStore } from "../lib/store";
import { timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";

interface Notif {
  id: string;
  type: "like" | "comment" | "follow" | "live";
  userId: string;
  text: string;
  createdAt: number;
}

export function Notifications() {
  const posts = useStore((s) => s.posts);
  const me = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.user);
  const following = useStore((s) => s.followingIds);
  const lives = useStore((s) => s.liveStreams);
  const notifLive = useStore((s) => s.settings.notifLive);
  const tr = useT();

  const notifs: Notif[] = [];

  // teman sedang Live (sesuai preferensi notifikasi)
  if (notifLive) {
    for (const live of lives) {
      if (live.userId === me) continue;
      notifs.push({
        id: `live-${live.id}`,
        type: "live",
        userId: live.userId,
        text: `sedang LIVE: ${live.title}`,
        createdAt: Date.now(),
      });
    }
  }

  for (const p of posts.filter((p) => p.userId === me)) {
    for (const uid of p.likedBy) {
      if (uid === me) continue;
      notifs.push({
        id: `like-${p.id}-${uid}`,
        type: "like",
        userId: uid,
        text: "menyukai postingan Anda",
        createdAt: p.createdAt,
      });
    }
    for (const c of p.comments) {
      if (c.userId === me) continue;
      notifs.push({
        id: `cmt-${c.id}`,
        type: "comment",
        userId: c.userId,
        text: `mengomentari: "${c.text}"`,
        createdAt: c.createdAt,
      });
    }
  }

  for (const uid of following) {
    notifs.push({
      id: `follow-${uid}`,
      type: "follow",
      userId: uid,
      text: "Anda mulai mengikuti",
      createdAt: Date.now(),
    });
  }

  notifs.sort((a, b) => b.createdAt - a.createdAt);

  const icon = {
    like: <Heart size={16} className="fill-red-500 text-red-500" />,
    comment: <MessageCircle size={16} className="text-sky-500" />,
    follow: <UserPlus size={16} className="text-fuchsia-500" />,
    live: <Radio size={16} className="text-red-500" />,
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="px-1 text-lg font-bold">{tr("page.notifications")}</h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {notifs.length === 0 ? (
          <div className="p-10 text-center text-zinc-400">
            Belum ada notifikasi. Mulai berinteraksi! 🔔
          </div>
        ) : (
          notifs.map((n) => {
            const u = user(n.userId);
            return (
              <div
                key={n.id}
                className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <div className="relative">
                  <img src={u.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-white dark:border-zinc-900 dark:bg-zinc-900">
                    {icon[n.type]}
                  </span>
                </div>
                <p className="flex-1 text-sm">
                  <span className="font-semibold">{u.name}</span>{" "}
                  <span className="text-zinc-600 dark:text-zinc-400">{n.text}</span>
                </p>
                <span className="shrink-0 text-xs text-zinc-400">{timeAgo(n.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
