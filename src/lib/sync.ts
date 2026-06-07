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
  } catch { started = false; /* gagal -> tetap lokal, boleh coba lagi */ }
}

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
