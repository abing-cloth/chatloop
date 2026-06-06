import { useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "../lib/utils";

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "🥳", "😜",
  "🤔", "😴", "😭", "😤", "😱", "🥰", "😇", "🙃", "😏", "🤗",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "✌️", "🤙", "👌",
  "❤️", "🔥", "✨", "🎉", "💯", "⭐", "💜", "💔", "😢", "🥹",
  "🐶", "🐱", "🦄", "🌸", "🍕", "☕", "🎵", "⚽", "🚀", "🌈",
];

export function EmojiPicker({
  onPick,
  className,
}: {
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("grid place-items-center text-zinc-500 transition hover:text-fuchsia-600 dark:hover:text-fuchsia-400", className)}
        title="Emoji"
      >
        <Smile size={20} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
            <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onPick(e); setOpen(false); }}
                  className="grid h-7 w-7 place-items-center rounded-lg text-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
