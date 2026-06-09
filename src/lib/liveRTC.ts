// Live audio host -> penonton via WebRTC, signaling lewat Supabase Realtime (broadcast).
// Feature-flagged: NO-OP bila backend Supabase belum aktif.
// Host mengirim SATU audio (mikrofon) ke banyak penonton (mesh dari host).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabase, supabaseEnabled } from "./supabase";

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/** HOST: siarkan suara mikrofon. Kembalikan fungsi stop (atau null bila backend mati/mic ditolak). */
export async function startBroadcast(liveId: string): Promise<(() => void) | null> {
  if (!supabaseEnabled || !liveId) return null;
  const sb = await getSupabase(); if (!sb) return null;
  let stream: MediaStream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch { return null; }
  const pcs = new Map<string, RTCPeerConnection>();
  const ch = sb.channel(`live:${liveId}`, { config: { broadcast: { self: false } } });
  const send = (event: string, payload: any) => ch.send({ type: "broadcast", event, payload });

  const makePc = async (vid: string) => {
    if (pcs.has(vid)) return;
    const pc = new RTCPeerConnection(ICE); pcs.set(vid, pc);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => { if (e.candidate) send("ice", { to: vid, from: "host", candidate: e.candidate }); };
    pc.onconnectionstatechange = () => { if (["failed", "closed", "disconnected"].includes(pc.connectionState)) { pc.close(); pcs.delete(vid); } };
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    send("offer", { to: vid, sdp: offer });
  };

  ch.on("broadcast", { event: "join" }, ({ payload }: any) => { makePc(payload.viewerId); });
  ch.on("broadcast", { event: "answer" }, async ({ payload }: any) => { const pc = pcs.get(payload.from); if (pc) try { await pc.setRemoteDescription(payload.sdp); } catch { /* */ } });
  ch.on("broadcast", { event: "ice" }, async ({ payload }: any) => { if (payload.to !== "host") return; const pc = pcs.get(payload.from); if (pc && payload.candidate) try { await pc.addIceCandidate(payload.candidate); } catch { /* */ } });
  await ch.subscribe((status: string) => { if (status === "SUBSCRIBED") send("host-ready", {}); });

  return () => { try { stream.getTracks().forEach((t) => t.stop()); pcs.forEach((pc) => pc.close()); sb.removeChannel(ch); } catch { /* */ } };
}

/** PENONTON: dengarkan suara host. onStream dipanggil dgn MediaStream audio. Kembalikan stop. */
export async function joinViewer(liveId: string, onStream: (s: MediaStream) => void): Promise<(() => void) | null> {
  if (!supabaseEnabled || !liveId) return null;
  const sb = await getSupabase(); if (!sb) return null;
  const viewerId = "v_" + Math.abs(Math.floor((performance.now() % 1) * 1e9) + (Date.now() % 100000)).toString(36) + Math.floor(performance.now()).toString(36);
  const pc = new RTCPeerConnection(ICE);
  pc.ontrack = (e) => { if (e.streams[0]) onStream(e.streams[0]); };
  const ch = sb.channel(`live:${liveId}`, { config: { broadcast: { self: false } } });
  const send = (event: string, payload: any) => ch.send({ type: "broadcast", event, payload });
  pc.onicecandidate = (e) => { if (e.candidate) send("ice", { to: "host", from: viewerId, candidate: e.candidate }); };

  ch.on("broadcast", { event: "offer" }, async ({ payload }: any) => {
    if (payload.to !== viewerId) return;
    try { await pc.setRemoteDescription(payload.sdp); const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); send("answer", { from: viewerId, sdp: ans }); } catch { /* */ }
  });
  ch.on("broadcast", { event: "ice" }, async ({ payload }: any) => { if (payload.to !== viewerId) return; if (payload.candidate) try { await pc.addIceCandidate(payload.candidate); } catch { /* */ } });
  ch.on("broadcast", { event: "host-ready" }, () => send("join", { viewerId }));
  await ch.subscribe((status: string) => { if (status === "SUBSCRIBED") send("join", { viewerId }); });

  return () => { try { pc.close(); sb.removeChannel(ch); } catch { /* */ } };
}
