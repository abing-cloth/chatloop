import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import { EmojiPicker } from "../components/EmojiPicker";

export function Messages() {
  const conversations = useStore((s) => s.conversations);
  const user = useStore((s) => s.user);
  const me = useStore((s) => s.currentUserId);
  const sendMessage = useStore((s) => s.sendMessage);
  const activeChatUserId = useStore((s) => s.activeChatUserId);
  const clearActiveChat = useStore((s) => s.clearActiveChat);

  const [activeId, setActiveId] = useState<string | null>(
    activeChatUserId ?? conversations[0]?.userId ?? null
  );
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.userId === activeId);

  // buka percakapan yang diminta dari luar (mis. "Hubungi Penjual")
  useEffect(() => {
    if (activeChatUserId) {
      setActiveId(activeChatUserId);
      clearActiveChat();
    }
  }, [activeChatUserId, clearActiveChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  function send() {
    if (!text.trim() || !activeId) return;
    sendMessage(activeId, text);
    setText("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* daftar percakapan */}
      <div
        className={cn(
          "w-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 sm:w-72",
          activeId && "hidden sm:block"
        )}
      >
        <div className="border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <h2 className="text-lg font-bold">Pesan</h2>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((c) => {
            const u = user(c.userId);
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.userId}
                onClick={() => setActiveId(c.userId)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  activeId === c.userId && "bg-fuchsia-50 dark:bg-fuchsia-950/40"
                )}
              >
                <img src={u.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    {last && (
                      <span className="shrink-0 text-[11px] text-zinc-400">
                        {timeAgo(last.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-zinc-500">
                    {last ? (last.fromId === me ? `Kamu: ${last.text}` : last.text) : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* panel chat */}
      {active ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
            <button
              onClick={() => setActiveId(null)}
              className="rounded-full p-1.5 hover:bg-zinc-100 sm:hidden dark:hover:bg-zinc-800"
            >
              <ArrowLeft size={20} />
            </button>
            <img
              src={user(active.userId).avatar}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold leading-tight">
                {user(active.userId).name}
              </p>
              <p className="text-xs text-emerald-500">Aktif sekarang</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
            {active.messages.map((m) => {
              const mine = m.fromId === me;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-[15px] shadow-sm",
                      mine
                        ? "rounded-br-md bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
                        : "rounded-bl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex flex-1 items-center gap-1 rounded-full bg-zinc-100 px-3 focus-within:ring-2 focus-within:ring-fuchsia-300 dark:bg-zinc-800">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tulis pesan..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
              />
              <EmojiPicker onPick={(e) => setText((t) => t + e)} />
            </div>
            <button
              onClick={send}
              disabled={!text.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 place-items-center text-zinc-400 sm:grid">
          Pilih percakapan untuk mulai mengobrol
        </div>
      )}
    </div>
  );
}
