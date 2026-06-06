import { X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { VerifiedBadge } from "./VerifiedBadge";
import type { User } from "../lib/types";

export function UserListModal({
  title,
  users,
  onClose,
}: {
  title: string;
  users: User[];
  onClose: () => void;
}) {
  const me = useStore((s) => s.currentUserId);
  const following = useStore((s) => s.followingIds);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openProfile = useStore((s) => s.openProfile);

  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-t-3xl bg-white sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <h3 className="text-base font-bold">{title} ({users.length})</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {users.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">Belum ada.</p>}
          {users.map((u) => {
            const isFollowing = following.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <button onClick={() => { openProfile(u.id); onClose(); }}>
                  <img src={u.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                </button>
                <button onClick={() => { openProfile(u.id); onClose(); }} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold">{u.name} {u.verified && <VerifiedBadge size={13} />}</p>
                  <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                </button>
                {u.id !== me && (
                  <button
                    onClick={() => toggleFollow(u.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                      isFollowing ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                    )}
                  >
                    {isFollowing ? "Mengikuti" : "Ikuti"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
