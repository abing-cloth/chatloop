import { useState } from "react";
import { Eye, Radio, Video } from "lucide-react";
import { useStore } from "../lib/store";
import { LiveRoom } from "../components/LiveRoom";
import type { LiveStream } from "../lib/types";

export function Live() {
  const lives = useStore((s) => s.liveStreams);
  const user = useStore((s) => s.user);
  const [watching, setWatching] = useState<LiveStream | null>(null);
  const [hosting, setHosting] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Radio size={20} className="text-red-500" /> Live
        </h2>
        <button
          onClick={() => setHosting(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Video size={16} /> Mulai Siaran
        </button>
      </div>

      <p className="px-1 text-sm text-zinc-500">
        {lives.length} sedang siaran langsung sekarang
      </p>

      <div className="grid grid-cols-2 gap-3">
        {lives.map((live) => {
          const u = user(live.userId);
          return (
            <button
              key={live.id}
              onClick={() => setWatching(live)}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-200 text-left dark:bg-zinc-800"
            >
              <img
                src={live.thumbnail}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

              {/* badge LIVE + penonton */}
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-dot" /> LIVE
              </div>
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                <Eye size={12} /> {live.viewers.toLocaleString("id-ID")}
              </div>

              {/* info bawah */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <img src={u.avatar} alt="" className="h-6 w-6 rounded-full border border-white/60 object-cover" />
                  <span className="truncate text-xs font-semibold text-white">{u.name}</span>
                </div>
                <p className="line-clamp-2 text-xs text-white/90">{live.title}</p>
              </div>
            </button>
          );
        })}
      </div>

      {watching && (
        <LiveRoom mode="viewer" stream={watching} onClose={() => setWatching(null)} />
      )}
      {hosting && <LiveRoom mode="host" onClose={() => setHosting(false)} />}
    </div>
  );
}
