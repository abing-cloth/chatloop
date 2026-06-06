import { useState } from "react";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import { VerifiedBadge } from "../components/VerifiedBadge";
import type { Group } from "../lib/types";

export function Groups() {
  const groups = useStore((s) => s.groups);
  const joined = useStore((s) => s.joinedGroupIds);
  const toggleJoin = useStore((s) => s.toggleJoinGroup);
  const [active, setActive] = useState<Group | null>(null);

  if (active) return <GroupDetail group={active} onBack={() => setActive(null)} />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <Users size={20} className="text-fuchsia-600" /> Grup & Komunitas
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const isJoined = joined.includes(g.id);
          return (
            <div key={g.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <button onClick={() => setActive(g)} className="block w-full">
                <img src={g.cover} alt="" className="h-24 w-full object-cover" />
              </button>
              <div className="p-3">
                <button onClick={() => setActive(g)} className="block text-left">
                  <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-medium text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                    {g.category}
                  </span>
                  <p className="mt-1.5 font-semibold leading-tight">{g.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{g.description}</p>
                  <p className="mt-1 text-xs text-zinc-400">{g.members.toLocaleString("id-ID")} anggota</p>
                </button>
                <button
                  onClick={() => toggleJoin(g.id)}
                  className={cn(
                    "mt-2 w-full rounded-lg py-2 text-sm font-semibold transition",
                    isJoined
                      ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                  )}
                >
                  {isJoined ? "Tergabung ✓" : "Gabung"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupDetail({ group, onBack }: { group: Group; onBack: () => void }) {
  const posts = useStore((s) => s.groupPosts.filter((p) => p.groupId === group.id));
  const user = useStore((s) => s.user);
  const me = useStore((s) => s.me());
  const joined = useStore((s) => s.joinedGroupIds.includes(group.id));
  const toggleJoin = useStore((s) => s.toggleJoinGroup);
  const addGroupPost = useStore((s) => s.addGroupPost);
  const [text, setText] = useState("");

  function post() {
    if (!text.trim()) return;
    addGroupPost(group.id, text);
    setText("");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        <ArrowLeft size={16} /> Semua grup
      </button>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <img src={group.cover} alt="" className="h-32 w-full object-cover" />
        <div className="p-4">
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-zinc-500">{group.members.toLocaleString("id-ID")} anggota · {group.category}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{group.description}</p>
          <button
            onClick={() => toggleJoin(group.id)}
            className={cn(
              "mt-3 w-full rounded-full py-2.5 text-sm font-semibold transition",
              joined ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            )}
          >
            {joined ? "Tergabung ✓" : "Gabung Grup"}
          </button>
        </div>
      </div>

      {/* tulis diskusi */}
      {joined ? (
        <div className="flex gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <img src={me.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && post()}
            placeholder={`Tulis di ${group.name}...`}
            className="flex-1 rounded-full bg-zinc-100 px-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
          />
          <button onClick={post} disabled={!text.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Gabung grup untuk ikut diskusi.
        </p>
      )}

      {/* diskusi */}
      <div className="space-y-3">
        {posts.length === 0 && <p className="py-4 text-center text-sm text-zinc-400">Belum ada diskusi.</p>}
        {posts.map((p) => {
          const u = user(p.userId);
          return (
            <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-semibold">{u.name}</span>
                {u.verified && <VerifiedBadge size={13} />}
                <span className="text-xs text-zinc-400">· {timeAgo(p.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">{p.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
