-- =====================================================================
--  SUUCHAT — Skema backend Supabase (jalankan di SQL Editor proyek Anda)
--  Sinkronisasi antar-perangkat: profil, postingan, live, pesan.
-- =====================================================================

-- 1) PROFIL (1:1 dgn auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  name        text not null,
  avatar      text,
  bio         text,
  verified    boolean default false,
  created_at  timestamptz default now()
);

-- 2) POSTINGAN (tampil di beranda semua pengguna)
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  text        text default '',
  image       text,
  liked_by    uuid[] default '{}',
  created_at  timestamptz default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

-- 3) SIARAN LANGSUNG (live)
create table if not exists public.lives (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  category    text not null,
  thumbnail   text,
  viewers     int default 1,
  active       boolean default true,
  created_at  timestamptz default now()
);
create index if not exists lives_active_idx on public.lives (active, created_at desc);

-- 4) PESAN (chat 1:1)
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references public.profiles(id) on delete cascade,
  to_id       uuid not null references public.profiles(id) on delete cascade,
  text        text default '',
  image       text,
  audio       text,
  duration    int,
  created_at  timestamptz default now()
);
create index if not exists messages_pair_idx on public.messages (from_id, to_id, created_at);

-- =====================================================================
--  RLS (Row Level Security)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.lives    enable row level security;
alter table public.messages enable row level security;

-- Profil: semua bisa baca; hanya pemilik yang ubah dirinya
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- Postingan: SEMUA pengguna bisa baca (beranda global); hanya pemilik yang tulis/ubah/hapus
create policy "posts read"   on public.posts for select using (true);
create policy "posts insert" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts update" on public.posts for update using (auth.uid() = user_id);
create policy "posts delete" on public.posts for delete using (auth.uid() = user_id);

-- Live: semua bisa baca; pemilik yang kelola
create policy "lives read"   on public.lives for select using (true);
create policy "lives insert" on public.lives for insert with check (auth.uid() = user_id);
create policy "lives update" on public.lives for update using (auth.uid() = user_id);
create policy "lives delete" on public.lives for delete using (auth.uid() = user_id);

-- Pesan: hanya pengirim/penerima yang boleh baca; pengirim yang menulis
create policy "messages read"   on public.messages for select using (auth.uid() in (from_id, to_id));
create policy "messages insert" on public.messages for insert with check (auth.uid() = from_id);

-- =====================================================================
--  Realtime: aktifkan publikasi perubahan
-- =====================================================================
alter publication supabase_realtime add table public.posts, public.lives, public.messages;

-- Storage (opsional, untuk foto/audio):
--   buat bucket publik 'media' di dashboard Storage.
