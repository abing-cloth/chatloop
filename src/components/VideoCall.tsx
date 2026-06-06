import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { User } from "../lib/types";

export function VideoCall({ user, onEnd }: { user: User; onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((s) => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => {});
    const t1 = setTimeout(() => setConnected(true), 1500);
    return () => { clearTimeout(t1); streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  useEffect(() => {
    if (!connected) return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [connected]);

  function toggleMute() {
    setMuted((m) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = m));
      return !m;
    });
  }
  function toggleCam() {
    setCamOff((c) => {
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = c));
      return !c;
    });
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-fuchsia-950 to-purple-950 text-white">
      {/* lawan bicara */}
      <img src={user.avatar} alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-white/20" />
      <h2 className="mt-4 text-2xl font-bold">{user.name}</h2>
      <p className="mt-1 text-sm text-white/70">{connected ? `${mm}:${ss}` : "Menghubungkan…"}</p>

      {/* kamera sendiri (PiP) */}
      <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/20">
        {camOff ? (
          <div className="grid h-full w-full place-items-center text-white/40"><VideoOff size={28} /></div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}
      </div>

      {/* kontrol */}
      <div className="absolute bottom-10 flex items-center gap-5">
        <button onClick={toggleMute} className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25">
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={onEnd} className="grid h-16 w-16 place-items-center rounded-full bg-red-600 transition hover:bg-red-700">
          <PhoneOff size={28} />
        </button>
        <button onClick={toggleCam} className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25">
          {camOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
      </div>
    </div>
  );
}
