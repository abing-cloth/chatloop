import { cn } from "../lib/utils";

interface Props {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ src, alt, size = 40, ring, className }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover bg-zinc-200",
        ring && "ring-2 ring-offset-2 ring-offset-white ring-fuchsia-500",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
