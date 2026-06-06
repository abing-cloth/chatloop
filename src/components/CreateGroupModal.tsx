import { useState } from "react";
import { Check, Users, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";

export function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const users = useStore((s) => s.users).filter((u) => u.id !== "me");
  const createGroupChat = useStore((s) => s.createGroupChat);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  function create() {
    if (picked.length < 1) return;
    createGroupChat(name, picked);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-t-3xl bg-white sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <h3 className="flex items-center gap-2 text-base font-bold"><Users size={18} className="text-fuchsia-600" /> Buat Grup</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={20} /></button>
        </div>
        <div className="p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama grup" className="mb-3 w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" />
          <p className="mb-2 text-xs font-medium text-zinc-500">Pilih anggota ({picked.length})</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {users.map((u) => {
            const on = picked.includes(u.id);
            return (
              <button key={u.id} onClick={() => toggle(u.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <span className="flex-1 text-left text-sm font-medium">{u.name}</span>
                <span className={cn("grid h-6 w-6 place-items-center rounded-full border-2", on ? "border-fuchsia-600 bg-fuchsia-600 text-white" : "border-zinc-300 dark:border-zinc-600")}>
                  {on && <Check size={14} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button onClick={create} disabled={picked.length < 1} className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white disabled:opacity-40">
            Buat Grup ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}
