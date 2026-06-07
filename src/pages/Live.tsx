import { useState } from "react";
import { Bell, BellRing, CalendarClock, Eye, Radio, Video, X } from "lucide-react";
import { useStore } from "../lib/store";
import { LiveRoom } from "../components/LiveRoom";
import { cn, countdown, formatSchedule } from "../lib/utils";
import { useT } from "../lib/i18n";
import type { LiveStream } from "../lib/types";

interface HostConfig {
  title: string;
  category: string;
}

// kategori live baku — selalu tampil untuk semua pengguna (tak bergantung siaran yang ada)
const LIVE_CATEGORIES = ["Obrolan", "Musik", "Game", "Belanja", "Edukasi", "Olahraga", "Kecantikan", "Masak", "Jalan-jalan"];

export function Live() {
  const lives = useStore((s) => s.liveStreams);
  const scheduled = useStore((s) => s.scheduledLives);
  const reminderIds = useStore((s) => s.reminderIds);
  const toggleReminder = useStore((s) => s.toggleReminder);
  const user = useStore((s) => s.user);
  const tr = useT();

  const categories = ["Semua", ...Array.from(new Set([...LIVE_CATEGORIES, ...lives.map((l) => l.category)]))];
  const [cat, setCat] = useState("Semua");
  const [watching, setWatching] = useState<LiveStream | null>(null);
  const [setup, setSetup] = useState(false);
  const [hosting, setHosting] = useState<HostConfig | null>(null);

  // form pra-siaran
  const [formTitle, setFormTitle] = useState("Siaran langsungku 🔴");
  const [formCat, setFormCat] = useState(categories[1] ?? "Obrolan");

  const filtered = cat === "Semua" ? lives : lives.filter((l) => l.category === cat);

  function goLive() {
    setHosting({ title: formTitle.trim() || "Siaran langsung", category: formCat });
    setSetup(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Radio size={20} className="text-red-500" /> {tr("page.live")}
        </h2>
        <button
          onClick={() => setSetup(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Video size={16} /> {tr("page.goLive")}
        </button>
      </div>

      {/* filter kategori */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              cat === c
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="px-1 text-sm text-zinc-500">
        {filtered.length} siaran langsung{cat !== "Semua" ? ` · ${cat}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Belum ada siaran di kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((live) => {
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
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-dot" /> LIVE
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                  <Eye size={12} /> {live.viewers.toLocaleString("id-ID")}
                </div>
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
      )}

      {/* jadwal siaran mendatang */}
      {scheduled.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="flex items-center gap-2 px-1 text-base font-bold">
            <CalendarClock size={18} className="text-fuchsia-600 dark:text-fuchsia-400" /> Akan Datang
          </h3>
          {[...scheduled]
            .sort((a, b) => a.startsAt - b.startsAt)
            .map((sc) => {
              const u = user(sc.userId);
              const reminded = reminderIds.includes(sc.id);
              return (
                <div
                  key={sc.id}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <img src={sc.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <img src={u.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                      <span className="truncate text-xs text-zinc-500">{u.name} · {sc.category}</span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold">{sc.title}</p>
                    <p className="mt-0.5 text-xs text-fuchsia-600 dark:text-fuchsia-400">
                      {formatSchedule(sc.startsAt)} · {countdown(sc.startsAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleReminder(sc.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition",
                      reminded
                        ? "bg-fuchsia-600 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    {reminded ? <BellRing size={14} /> : <Bell size={14} />}
                    {reminded ? "Diingatkan" : "Ingatkan"}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* modal setup pra-siaran */}
      {setup && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSetup(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Radio size={18} className="text-red-500" /> Siapkan Siaran
              </h3>
              <button
                onClick={() => setSetup(false)}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-1 block text-xs font-medium text-zinc-500">Judul siaran</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={80}
              placeholder="Mau ngapain hari ini?"
              className="mb-4 w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 dark:bg-zinc-800"
            />

            <label className="mb-1 block text-xs font-medium text-zinc-500">Kategori</label>
            <div className="mb-5 flex flex-wrap gap-2">
              {categories
                .filter((c) => c !== "Semua")
                .map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormCat(c)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      formCat === c
                        ? "bg-red-500 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    {c}
                  </button>
                ))}
            </div>

            <button
              onClick={goLive}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-pink-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Video size={16} /> Siaran Sekarang
            </button>
            <p className="mt-3 text-center text-xs text-zinc-400">
              Kamera akan diaktifkan. Pastikan izin kamera diberikan.
            </p>
          </div>
        </div>
      )}

      {watching && (
        <LiveRoom mode="viewer" stream={watching} onClose={() => setWatching(null)} />
      )}
      {hosting && (
        <LiveRoom
          mode="host"
          title={hosting.title}
          category={hosting.category}
          onClose={() => setHosting(null)}
        />
      )}
    </div>
  );
}
