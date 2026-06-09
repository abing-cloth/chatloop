// Sinkronisasi realtime ke Supabase (feature-flagged).
// Semua fungsi NO-OP bila backend tak dikonfigurasi -> app jalan lokal seperti biasa.
// Cakupan: auth anonim + profil, posts & lives (beranda global realtime).
// (Pesan/DM menyusul.)
import { getSupabase, supabaseEnabled } from "./supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyStore = { getState: () => any; setState: (u: any) => void };

let started = false;

const has = (arr: any[], id: string) => arr.some((x) => x.id === id);
const rowToPost = (r: any) => ({ id: r.id, userId: r.user_id, text: r.text || "", image: r.image || undefined, createdAt: Date.parse(r.created_at) || Date.now(), likedBy: r.liked_by || [], comments: [] });
const rowToLive = (r: any) => ({ id: r.id, userId: r.user_id, title: r.title, category: r.category, thumbnail: r.thumbnail || "", viewers: r.viewers || 1 });
const rowToUser = (r: any) => ({ id: r.id, name: r.name, username: r.username, avatar: r.avatar || "", bio: r.bio || "", verified: !!r.verified });

/** Inisialisasi backend: auth anon + profil + muat & langganan posts/lives. */
export async function initSync(store: AnyStore) {
  if (!supabaseEnabled || started) return;
  started = true;
  try {
    const sb = await getSupabase();
    if (!sb) return;
    // auth anonim (dapat uid stabil per perangkat)
    let { data: { session } } = await sb.auth.getSession();
    if (!session) { const r = await sb.auth.signInAnonymously(); session = r.data?.session; }
    const uid = session?.user?.id;
    if (!uid) return;

    const me = store.getState().me();
    // daftarkan/segarkan profil
    await sb.from("profiles").upsert({ id: uid, username: me.username, name: me.name, avatar: me.avatar, bio: me.bio ?? "", verified: !!me.verified });
    store.setState({ currentUserId: uid });

    // muat data awal
    const [{ data: profs }, { data: posts }, { data: lives }] = await Promise.all([
      sb.from("profiles").select("*"),
      sb.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("lives").select("*").eq("active", true).order("created_at", { ascending: false }),
    ]);

    store.setState((s: any) => {
      const users = [...s.users];
      for (const p of profs ?? []) { const u = rowToUser(p); const i = users.findIndex((x) => x.id === u.id); if (i >= 0) users[i] = { ...users[i], ...u }; else users.push(u); }
      const remotePosts = (posts ?? []).map(rowToPost);
      const remoteLives = (lives ?? []).map(rowToLive);
      // remote = sumber kebenaran; pertahankan seed lokal yang tak ada di remote
      const mergedPosts = [...remotePosts, ...s.posts.filter((p: any) => !has(remotePosts, p.id))];
      const mergedLives = [...remoteLives, ...s.liveStreams.filter((l: any) => !has(remoteLives, l.id))];
      return { users, posts: mergedPosts, liveStreams: mergedLives };
    });

    // langganan realtime
    sb.channel("rt-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (p: any) => {
        const post = rowToPost(p.new);
        store.setState((s: any) => (has(s.posts, post.id) ? {} : { posts: [post, ...s.posts] }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (p: any) => {
        store.setState((s: any) => ({ posts: s.posts.filter((x: any) => x.id !== p.old.id) }));
      })
      .subscribe();

    sb.channel("rt-lives")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lives" }, (p: any) => {
        if (!p.new.active) return;
        const live = rowToLive(p.new);
        store.setState((s: any) => (has(s.liveStreams, live.id) ? {} : { liveStreams: [live, ...s.liveStreams] }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lives" }, (p: any) => {
        if (p.new.active) return;
        store.setState((s: any) => ({ liveStreams: s.liveStreams.filter((x: any) => x.id !== p.new.id) }));
      })
      .subscribe();

    // ── PESAN/DM: muat awal + langganan realtime ──
    const { data: msgs } = await sb.from("messages").select("*").or(`from_id.eq.${uid},to_id.eq.${uid}`).order("created_at", { ascending: true }).limit(500);
    if (msgs?.length) {
      const convMap: Record<string, any[]> = {};
      for (const m of msgs) { const other = m.from_id === uid ? m.to_id : m.from_id; (convMap[other] ??= []).push(rowToMsg(m)); }
      store.setState((s: any) => {
        const convs = [...s.conversations];
        for (const [other, list] of Object.entries(convMap)) {
          const i = convs.findIndex((c) => c.userId === other);
          if (i >= 0) convs[i] = { ...convs[i], messages: list }; else convs.unshift({ userId: other, messages: list });
        }
        return { conversations: convs };
      });
    }
    sb.channel("rt-msgs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `to_id=eq.${uid}` }, (p: any) => {
        const m = p.new, other = m.from_id, msg = rowToMsg(m);
        store.setState((s: any) => {
          const convs = [...s.conversations];
          const i = convs.findIndex((c) => c.userId === other);
          if (i >= 0) { if (convs[i].messages.some((x: any) => x.id === msg.id)) return {}; convs[i] = { ...convs[i], messages: [...convs[i].messages, msg] }; }
          else convs.unshift({ userId: other, messages: [msg] });
          return { conversations: convs };
        });
      })
      .subscribe();
  } catch { started = false; /* gagal -> tetap lokal, boleh coba lagi */ }
}

const rowToMsg = (m: any) => ({ id: m.id, fromId: m.from_id, text: m.text || "", image: m.image || undefined, audio: m.audio || undefined, duration: m.duration || undefined, createdAt: Date.parse(m.created_at) || Date.now(), read: true });

/** Kirim postingan baru ke backend (echo realtime ke semua pengguna). */
export async function mirrorPost(post: any) {
  if (!supabaseEnabled) return;
  try {
    const sb = await getSupabase(); if (!sb) return;
    await sb.from("posts").insert({ id: post.id, user_id: post.userId, text: post.text, image: post.image ?? null, liked_by: post.likedBy ?? [] });
  } catch { /* */ }
}

/** Daftarkan siaran live ke backend. */
export async function mirrorLive(live: any) {
  if (!supabaseEnabled) return;
  try {
    const sb = await getSupabase(); if (!sb) return;
    await sb.from("lives").insert({ id: live.id, user_id: live.userId, title: live.title, category: live.category, thumbnail: live.thumbnail ?? null, viewers: live.viewers ?? 1, active: true });
  } catch { /* */ }
}

/** Tandai live berakhir di backend. */
export async function endLiveRemote(id: string) {
  if (!supabaseEnabled) return;
  try {
    const sb = await getSupabase(); if (!sb) return;
    await sb.from("lives").update({ active: false }).eq("id", id);
  } catch { /* */ }
}

/** Kirim pesan/DM ke backend (penerima dapat via realtime). */
export async function mirrorMessage(fromId: string, toId: string, text: string, opts?: { image?: string; audio?: string; duration?: number }) {
  if (!supabaseEnabled) return;
  try {
    const sb = await getSupabase(); if (!sb) return;
    await sb.from("messages").insert({ from_id: fromId, to_id: toId, text: text || "", image: opts?.image ?? null, audio: opts?.audio ?? null, duration: opts?.duration ?? null });
  } catch { /* */ }
}
