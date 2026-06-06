import { useStore } from "../lib/store";

export function RightBar() {
  const users = useStore((s) => s.users).filter((u) => u.id !== "me");
  const following = useStore((s) => s.followingIds);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openProfile = useStore((s) => s.openProfile);

  return (
    <aside className="sticky top-20 hidden h-fit w-72 shrink-0 xl:block">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-500">Saran untuk kamu</h3>
          <button className="text-xs font-medium text-fuchsia-600">Lihat semua</button>
        </div>
        <div className="space-y-3">
          {users.map((u) => {
            const isFollowing = following.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-3">
                <button onClick={() => openProfile(u.id)}>
                  <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                </button>
                <button onClick={() => openProfile(u.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold hover:underline">{u.name}</p>
                  <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                </button>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={
                    isFollowing
                      ? "rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : "rounded-full bg-fuchsia-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-700"
                  }
                >
                  {isFollowing ? "Mengikuti" : "Ikuti"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 px-2 text-xs leading-relaxed text-zinc-400">
        ChatLoop © 2026 · Tentang · Bantuan · Privasi · Ketentuan
        <br />
        Dibuat dengan 💜 di Indonesia
      </p>
    </aside>
  );
}
