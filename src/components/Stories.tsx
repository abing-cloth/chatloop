import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, fileToDataUrl } from "../lib/utils";
import type { Story } from "../lib/types";

const DAY = 24 * 60 * 60 * 1000;

export function Stories() {
  const allStories = useStore((s) => s.stories);
  const me = useStore((s) => s.me());
  const user = useStore((s) => s.user);
  const blocked = useStore((s) => s.blockedIds);
  const markSeen = useStore((s) => s.markStorySeen);
  const addStory = useStore((s) => s.addStory);
  const [active, setActive] = useState<Story | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // hanya status < 24 jam & bukan dari pengguna diblokir
  const stories = allStories.filter(
    (st) => Date.now() - st.createdAt < DAY && !blocked.includes(st.userId) && !user(st.userId).banned
  );

  async function onAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) addStory(await fileToDataUrl(f));
    e.target.value = "";
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-zinc-800 dark:bg-zinc-900">
        {/* Your story */}
        <button onClick={() => fileRef.current?.click()} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <img
              src={me.avatar}
              alt={me.name}
              className="h-16 w-16 rounded-full object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-fuchsia-600 text-white dark:border-zinc-900">
              <Plus size={12} />
            </span>
          </div>
          <span className="truncate text-xs text-zinc-600">Cerita Anda</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAdd} />

        {stories.map((st) => {
          const u = user(st.userId);
          return (
            <button
              key={st.id}
              onClick={() => {
                setActive(st);
                markSeen(st.id);
              }}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "rounded-full p-[2.5px]",
                  st.seen
                    ? "bg-zinc-300"
                    : "bg-gradient-to-tr from-amber-400 via-fuchsia-500 to-purple-600"
                )}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="h-[58px] w-[58px] rounded-full border-2 border-white object-cover dark:border-zinc-900"
                />
              </span>
              <span className="w-full truncate text-center text-xs text-zinc-600">
                {u.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story viewer */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
        >
          <button className="absolute right-4 top-4 text-white/80 hover:text-white">
            <X size={28} />
          </button>
          <div className="animate-pop relative max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl">
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-4">
              <img
                src={user(active.userId).avatar}
                alt=""
                className="h-9 w-9 rounded-full border border-white/50 object-cover"
              />
              <span className="font-semibold text-white">
                {user(active.userId).username}
              </span>
            </div>
            <img src={active.image} alt="story" className="h-full w-full object-cover" />
          </div>
        </div>
      )}
    </>
  );
}
