// Integrasi backend Supabase (feature-flagged) untuk sinkronisasi antar-perangkat.
// AKTIF hanya jika env VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY diisi.
// Tanpa kunci -> getSupabase() mengembalikan null & aplikasi berjalan 100% seperti sekarang
// (offline/lokal). Klien dimuat lewat CDN ESM saat dibutuhkan (tak menambah bundle).

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true jika kredensial Supabase tersedia (backend siap dipakai). */
export const supabaseEnabled = !!(URL && KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

/** Ambil klien Supabase (lazy, lewat CDN). null bila backend belum dikonfigurasi. */
export async function getSupabase() {
  if (!supabaseEnabled) return null;
  if (client) return client;
  try {
    const cdn = "https://esm.sh/@supabase/supabase-js@2";
    const mod = await import(/* @vite-ignore */ cdn);
    client = mod.createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 5 } },
    });
    return client;
  } catch {
    return null; // gagal memuat -> tetap jalan lokal
  }
}
