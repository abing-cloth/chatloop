import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { MentionText } from "./MentionText";
import type { GroupChat } from "../lib/types";

const G_REPLIES = ["Setuju! 👍", "Wkwk mantap", "Aku ikut 🙌", "Boleh banget", "Gas lah 🔥", "Oke noted ✍️", "Hadir! ✋", "😂😂"];

export function GroupChatPanel({ group, onBack }: { group: GroupChat; onBack: () => void }) {
  const me = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.user);
  const sendGroupMessage = useStore((s) => s.sendGroupMessage);
  const receiveGroupMessage = useStore((s) => s.receiveGroupMessage);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [group.messages.length]);

  function send() {
    if (!text.trim()) return;
    sendGroupMessage(group.id, text);
    setText("");
    const from = group.memberIds[Math.floor(Math.random() * group.memberIds.length)];
    if (from) setTimeout(() => receiveGroupMessage(group.id, from, G_REPLIES[Math.floor(Math.random() * G_REPLIES.length)]), 1600);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-zinc-100 sm:hidden dark:hover:bg-zinc-800"><ArrowLeft size={20} /></button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400"><Users size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{group.name}</p>
          <p className="truncate text-xs text-zinc-500">
            Kamu, {group.memberIds.map((id) => user(id).name.split(" ")[0]).join(", ")}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
        {group.messages.map((m) => {
          const mine = m.fromId === me;
          const u = user(m.fromId);
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
              {!mine && <img src={u.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
              <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-[15px] shadow-sm", mine ? "rounded-br-md bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white" : "rounded-bl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100")}>
                {!mine && <p className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">{u.name}</p>}
                <MentionText text={m.text} />
              </div>
            </div>
          );
        })}
        {group.messages.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Mulai percakapan grup 👋</p>}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-1 items-center gap-1 rounded-full bg-zinc-100 px-3 focus-within:ring-2 focus-within:ring-fuchsia-300 dark:bg-zinc-800">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pesan ke grup..." className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
          <EmojiPicker onPick={(e) => setText((t) => t + e)} />
        </div>
        <button onClick={send} disabled={!text.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-40"><Send size={17} /></button>
      </div>
    </div>
  );
}
