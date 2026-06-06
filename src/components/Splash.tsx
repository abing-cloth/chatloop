import { useEffect } from "react";

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600">
      <div className="animate-pop flex flex-col items-center">
        <div className="grid h-28 w-28 place-items-center rounded-[28px] bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          <img src="/chatloop.svg" alt="ChatLoop" className="h-20 w-20 drop-shadow-lg" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
          ChatLoop
        </h1>
        <p className="mt-1 text-sm text-white/80">Ngobrol, terhubung, tanpa henti</p>
      </div>

      {/* loading dots */}
      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-white/80"
            style={{
              animation: "loop-bounce 1s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
