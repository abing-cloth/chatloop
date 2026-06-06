import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Send, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import { EmojiPicker } from "../components/EmojiPicker";
import { MentionText } from "../components/MentionText";

const REPLIES = ["Oke siap! 👍", "Wah menarik 😄", "Hehe iya bener", "Mantap! 🔥", "Nanti aku kabari ya", "😂😂😂", "Setuju banget!", "Makasih ya 🙏", "Boleh, gas!", "Wkwk iya juga"];

export function Messages() {
  const conversations = useStore((s) => s.conversations);
  const user = useStore((s) => s.user);
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.currentUserId);
  const sendMessage = useStore((s) => s.sendMessage);
  const receiveMessage = useStore((s) => s.receiveMessage);
  const deleteMessage = useStore((s) => s.deleteMessage);
  const activeChatUserId = useStore((s) => s.activeChatUserId);
  const clearActiveChat = useStore((s) => s.clearActiveChat);
  const archived = useStore((s) => s.archivedChatIds);
  const toggleArchive = useStore((s) => s.toggleArchiveChat);

  const [activeId, setActiveId] = useState<string | null>(
    activeChatUserId ?? conversations[0]?.userId ?? null
  );
  const [showArchived, setShowArchived] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const mentionMatch = text.match(/@([a-zA-Z0-9_.]*)$/);
  const mentionList = mentionMatch
    ? users.filter((u) => u.id !== me).filter((u) => {
        const q = mentionMatch[1].toLowerCase();
        return u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];

  const visible = conversations.filter((c) =>
    showArchived ? archived.includes(c.userId) : !archived.includes(c.userId)
  );

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
  }, [active?.messages.length, activeId, typing]);

  function send() {
    if (!text.trim() || !activeId) return;
    const to = activeId;
    sendMessage(to, text);
    setText("");
    // simulasi lawan bicara mengetik lalu membalas
    setTyping(true);
    setTimeout(() => {
      receiveMessage(to, REPLIES[Math.floor(Math.random() * REPLIES.length)]);
      setTyping(false);
    }, 1600);
  }

  function pickMention(username: string) {
    setText(text.replace(/@[a-zA-Z0-9_.]*$/, `@${username} `));
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
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-bold">{showArchived ? "Arsip" : "Pesan"}</h2>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
              showArchived ? "bg-fuchsia-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            )}
          >
            <Archive size={14} /> {showArchived ? "Aktif" : `Arsip${archived.length ? ` (${archived.length})` : ""}`}
          </button>
        </div>
        <div className="overflow-y-auto">
          {visible.length === 0 && (
            <p className="p-8 text-center text-sm text-zinc-400">{showArchived ? "Tidak ada chat diarsipkan." : "Tidak ada percakapan."}</p>
          )}
          {visible.map((c) => {
            const u = user(c.userId);
            const last = c.messages[c.messages.length - 1];
            const isArchived = archived.includes(c.userId);
            return (
              <div
                key={c.userId}
                onClick={() => setActiveId(c.userId)}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  activeId === c.userId && "bg-fuchsia-50 dark:bg-fuchsia-950/40"
                )}
              >
                <div className="relative shrink-0">
                  <img src={u.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    {last && <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(last.createdAt)}</span>}
                  </div>
                  <p className="truncate text-sm text-zinc-500">
                    {last ? (last.fromId === me ? `Kamu: ${last.text}` : last.text) : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleArchive(c.userId); }}
                  title={isArchived ? "Keluarkan dari arsip" : "Arsipkan"}
                  className="rounded-full p-1.5 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-700"
                >
                  {isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>
              </div>
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
            <div className="relative">
              <img src={user(active.userId).avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{user(active.userId).name}</p>
              <p className="text-xs text-emerald-500">{typing ? "sedang mengetik…" : "Aktif sekarang"}</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
            {active.messages.map((m) => {
              const mine = m.fromId === me;
              return (
                <div key={m.id} className={cn("group flex items-center gap-1.5", mine ? "justify-end" : "justify-start")}>
                  {mine && (
                    <button
                      onClick={() => deleteMessage(active.userId, m.id)}
                      title="Hapus pesan"
                      className="rounded-full p-1 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-[15px] shadow-sm",
                      mine
                        ? "rounded-br-md bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
                        : "rounded-bl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    )}
                  >
                    <MentionText text={m.text} />
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-zinc-800">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-zinc-400" style={{ animation: "loop-bounce 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="relative flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
            {mentionList.length > 0 && (
              <div className="absolute bottom-full left-3 mb-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                {mentionList.map((u) => (
                  <button key={u.id} onClick={() => pickMention(u.username)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <img src={u.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <span className="text-sm font-medium">{u.name}</span>
                    <span className="ml-auto text-xs text-zinc-400">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
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
