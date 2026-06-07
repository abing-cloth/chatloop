import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Check, CheckCheck, ImagePlus, MapPin, Mic, Phone, Reply, Send, SmilePlus, Trash2, Video, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, fileToDataUrl, timeAgo } from "../lib/utils";
import { Users } from "lucide-react";
import { EmojiPicker } from "../components/EmojiPicker";
import { MentionText } from "../components/MentionText";
import { VideoCall } from "../components/VideoCall";
import { GroupChatPanel } from "../components/GroupChatPanel";
import { CreateGroupModal } from "../components/CreateGroupModal";

const REPLIES = ["Oke siap! 👍", "Wah menarik 😄", "Hehe iya bener", "Mantap! 🔥", "Nanti aku kabari ya", "😂😂😂", "Setuju banget!", "Makasih ya 🙏", "Boleh, gas!", "Wkwk iya juga"];
const REACTS = ["❤️", "😂", "👍", "😮", "😢", "🙏"];

export function Messages() {
  const conversations = useStore((s) => s.conversations);
  const groupChats = useStore((s) => s.groupChats);
  const user = useStore((s) => s.user);
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.currentUserId);
  const sendMessage = useStore((s) => s.sendMessage);
  const receiveMessage = useStore((s) => s.receiveMessage);
  const deleteMessage = useStore((s) => s.deleteMessage);
  const markRead = useStore((s) => s.markConversationRead);
  const reactMessage = useStore((s) => s.reactMessage);
  const activeChatUserId = useStore((s) => s.activeChatUserId);
  const clearActiveChat = useStore((s) => s.clearActiveChat);
  const archived = useStore((s) => s.archivedChatIds);
  const toggleArchive = useStore((s) => s.toggleArchiveChat);

  const [activeId, setActiveId] = useState<string | null>(
    activeChatUserId ?? conversations[0]?.userId ?? null
  );
  const [showArchived, setShowArchived] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [text, setText] = useState("");
  const activeGroup = groupChats.find((g) => g.id === activeGroupId) ?? null;
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; name: string } | null>(null);
  const [reactingId, setReactingId] = useState<string | null>(null);
  const [callMode, setCallMode] = useState<null | "voice" | "video">(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStreamRef = useRef<MediaStream | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    sendMessage(to, text, { replyToId: replyTo?.id });
    setText("");
    setReplyTo(null);
    setTyping(true);
    setTimeout(() => {
      markRead(to); // lawan bicara "membaca" pesanmu
      receiveMessage(to, REPLIES[Math.floor(Math.random() * REPLIES.length)]);
      setTyping(false);
    }, 1600);
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && activeId) {
      const to = activeId;
      sendMessage(to, "", { image: await fileToDataUrl(f), replyToId: replyTo?.id });
      setReplyTo(null);
      setTimeout(() => markRead(to), 1200);
    }
    e.target.value = "";
  }

  function pickMention(username: string) {
    setText(text.replace(/@[a-zA-Z0-9_.]*$/, `@${username} `));
  }

  function shareLocation() {
    if (!activeId) return;
    const to = activeId;
    if (!navigator.geolocation) return alert("Perangkat tidak mendukung lokasi.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendMessage(to, "", { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
        setTimeout(() => markRead(to), 1200);
      },
      () => alert("Tidak bisa mengambil lokasi (izin ditolak).")
    );
  }

  const msgById = (id?: string) => (id ? active?.messages.find((m) => m.id === id) : undefined);

  async function startRec() {
    if (!activeId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setRecSec(0);
      recTimerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      alert("Tidak bisa mengakses mikrofon.");
    }
  }

  function stopRec(sendIt: boolean) {
    const rec = recRef.current;
    const to = activeId;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false);
    if (!rec) return;
    const dur = recSec;
    rec.onstop = async () => {
      recStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (sendIt && to && chunksRef.current.length) {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          sendMessage(to, "", { audio: reader.result as string, duration: dur });
          setTimeout(() => markRead(to), 1200);
        };
        reader.readAsDataURL(blob);
      }
    };
    rec.stop();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* daftar percakapan */}
      <div
        className={cn(
          "w-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 sm:w-72",
          (activeId || activeGroupId) && "hidden sm:block"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-bold">{showArchived ? "Arsip" : "Pesan"}</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowCreateGroup(true)} title="Buat grup" className="grid h-7 w-7 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700"><Users size={14} /></button>
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
        </div>
        <div className="overflow-y-auto">
          {!showArchived && groupChats.map((g) => {
            const last = g.messages[g.messages.length - 1];
            return (
              <div
                key={g.id}
                onClick={() => { setActiveGroupId(g.id); setActiveId(null); }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  activeGroupId === g.id && "bg-fuchsia-50 dark:bg-fuchsia-950/40"
                )}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400"><Users size={22} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{g.name}</p>
                    {last && <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(last.createdAt)}</span>}
                  </div>
                  <p className="truncate text-sm text-zinc-500">
                    {last ? `${last.fromId === me ? "Kamu" : user(last.fromId).name.split(" ")[0]}: ${last.text}` : `${g.memberIds.length + 1} anggota`}
                  </p>
                </div>
              </div>
            );
          })}
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
                onClick={() => { setActiveId(c.userId); setActiveGroupId(null); }}
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
      {activeGroup ? (
        <GroupChatPanel group={activeGroup} onBack={() => setActiveGroupId(null)} />
      ) : active ? (
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
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">{user(active.userId).name}</p>
              <p className="text-xs text-emerald-500">{typing ? "sedang mengetik…" : "Aktif sekarang"}</p>
            </div>
            <button onClick={() => setCallMode("voice")} title="Panggilan suara" className="grid h-9 w-9 place-items-center rounded-full text-fuchsia-600 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/40">
              <Phone size={19} />
            </button>
            <button onClick={() => setCallMode("video")} title="Panggilan video" className="grid h-9 w-9 place-items-center rounded-full text-fuchsia-600 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/40">
              <Video size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
            {active.messages.map((m) => {
              const mine = m.fromId === me;
              const replied = msgById(m.replyToId);
              return (
                <div key={m.id} className={cn("group relative flex items-center gap-1.5", mine ? "justify-end" : "justify-start")}>
                  {mine && (
                    <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => setReactingId(reactingId === m.id ? null : m.id)} title="Reaksi" className="rounded-full p-1 text-zinc-400 hover:text-fuchsia-600"><SmilePlus size={14} /></button>
                      <button onClick={() => setReplyTo({ id: m.id, text: m.text || (m.audio ? "🎤 Voice note" : "📷 Foto"), name: "kamu" })} title="Balas" className="rounded-full p-1 text-zinc-400 hover:text-fuchsia-600"><Reply size={14} /></button>
                      <button onClick={() => deleteMessage(active.userId, m.id)} title="Hapus pesan" className="rounded-full p-1 text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  )}
                  <div className={cn("relative max-w-[75%]", mine ? "items-end" : "items-start", "flex flex-col gap-0.5")}>
                    {reactingId === m.id && (
                      <div className={cn("absolute -top-9 z-10 flex gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800", mine ? "right-0" : "left-0")}>
                        {REACTS.map((e) => (
                          <button key={e} onClick={() => { reactMessage(active.userId, m.id, e); setReactingId(null); }} className="text-lg transition hover:scale-125">{e}</button>
                        ))}
                      </div>
                    )}
                    <div className={cn("overflow-hidden rounded-2xl text-[15px] shadow-sm", mine ? "rounded-br-md bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white" : "rounded-bl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100")}>
                      {replied && (
                        <div className={cn("mx-1 mt-1 rounded-lg px-2 py-1 text-xs", mine ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-700/60")}>
                          <span className="font-semibold">{replied.fromId === me ? "Kamu" : user(replied.fromId).name}</span>
                          <p className="truncate opacity-80">{replied.text || (replied.audio ? "🎤 Voice note" : "📷 Foto")}</p>
                        </div>
                      )}
                      {m.image && <img src={m.image} alt="" className="max-h-64 w-full object-cover" />}
                      {m.audio && (
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Mic size={16} className={mine ? "text-white/90" : "text-fuchsia-600"} />
                          <audio controls src={m.audio} className="h-8 max-w-[180px]" />
                          {m.duration ? <span className="text-xs opacity-80">{m.duration}s</span> : null}
                        </div>
                      )}
                      {m.location && (
                        <a href={`https://www.google.com/maps?q=${m.location.lat},${m.location.lng}`} target="_blank" rel="noreferrer" className="block w-56">
                          <img
                            src={`https://staticmap.openstreetmap.de/staticmap.php?center=${m.location.lat},${m.location.lng}&zoom=15&size=300x140&markers=${m.location.lat},${m.location.lng},red-pushpin`}
                            alt="peta"
                            className="h-28 w-full bg-zinc-200 object-cover dark:bg-zinc-700"
                            onError={(e) => { (e.currentTarget.style.display = "none"); }}
                          />
                          <div className={cn("flex items-center gap-1.5 px-3 py-2 text-sm", mine ? "text-white" : "text-zinc-700 dark:text-zinc-200")}>
                            <MapPin size={15} /> Lokasi saya · Buka di Maps
                          </div>
                        </a>
                      )}
                      {m.text && <p className="px-4 py-2"><MentionText text={m.text} /></p>}
                    </div>
                    {m.reaction && (
                      <span className={cn("absolute -bottom-2 rounded-full bg-white px-1 text-sm shadow ring-1 ring-zinc-100 dark:bg-zinc-700 dark:ring-zinc-600", mine ? "right-1" : "left-1")}>{m.reaction}</span>
                    )}
                    {mine && (
                      <span className="flex items-center gap-0.5 pr-1 pt-1 text-[10px] text-zinc-400">
                        {timeAgo(m.createdAt)} {m.read ? <CheckCheck size={13} className="text-sky-500" /> : <Check size={13} />}
                      </span>
                    )}
                  </div>
                  {!mine && (
                    <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => setReactingId(reactingId === m.id ? null : m.id)} title="Reaksi" className="rounded-full p-1 text-zinc-400 hover:text-fuchsia-600"><SmilePlus size={14} /></button>
                      <button onClick={() => setReplyTo({ id: m.id, text: m.text || (m.audio ? "🎤 Voice note" : "📷 Foto"), name: user(m.fromId).name })} title="Balas" className="rounded-full p-1 text-zinc-400 hover:text-fuchsia-600"><Reply size={14} /></button>
                    </div>
                  )}
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

          {replyTo && (
            <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="min-w-0">
                <p className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">Membalas {replyTo.name}</p>
                <p className="truncate text-zinc-500">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-zinc-400"><X size={16} /></button>
            </div>
          )}
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
            {recording ? (
              <div className="flex flex-1 items-center gap-3 rounded-full bg-red-50 px-4 py-2 dark:bg-red-950/40">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-live-dot" />
                <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">Merekam… {recSec}s</span>
                <button onClick={() => stopRec(false)} title="Batal" className="text-zinc-500"><X size={18} /></button>
                <button onClick={() => stopRec(true)} title="Kirim" className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-600 text-white"><Send size={16} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => fileRef.current?.click()} title="Kirim foto" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <ImagePlus size={20} />
                </button>
                <button onClick={shareLocation} title="Bagikan lokasi" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <MapPin size={20} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={sendImage} />
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
                {text.trim() ? (
                  <button onClick={send} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700"><Send size={17} /></button>
                ) : (
                  <button onClick={startRec} title="Rekam suara" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700"><Mic size={18} /></button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 place-items-center text-zinc-400 sm:grid">
          Pilih percakapan untuk mulai mengobrol
        </div>
      )}

      {callMode && active && (
        <VideoCall
          user={user(active.userId)}
          mode={callMode}
          onEnd={(secs) => {
            const to = active.userId, m = callMode;
            const dur = secs ?? 0;
            const mms = `${String(Math.floor(dur / 60)).padStart(2, "0")}:${String(dur % 60).padStart(2, "0")}`;
            // catat panggilan di riwayat chat
            sendMessage(to, `${m === "video" ? "📹 Panggilan video" : "📞 Panggilan suara"} · ${dur > 0 ? mms : "tak terjawab"}`);
            setCallMode(null);
          }}
        />
      )}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            const g = useStore.getState().groupChats[0];
            if (g) { setActiveGroupId(g.id); setActiveId(null); }
          }}
        />
      )}
    </div>
  );
}
