import { Star } from "lucide-react";
import { cn } from "../lib/utils";

/** Tampilan rating (read-only) */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

/** Input rating (klik bintang) */
export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition active:scale-90">
          <Star
            size={size}
            className={cn(
              i <= value ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-300 dark:fill-zinc-700 dark:text-zinc-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}
