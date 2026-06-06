import {
  Bell,
  Info,
  LogOut,
  Moon,
  RotateCcw,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { Settings as SettingsType } from "../lib/store";
import { cn } from "../lib/utils";

export function Settings() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetAll);
  const me = useStore((s) => s.me());

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <h2 className="px-1 text-lg font-bold">Pengaturan</h2>

      <Section icon={<Moon size={18} />} title="Tampilan">
        <Row
          label="Mode gelap"
          desc="Tampilan nyaman saat malam hari"
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
      </Section>

      <Section icon={<Bell size={18} />} title="Notifikasi">
        <Toggle k="notifLikes" label="Suka" desc="Saat ada yang menyukai postinganmu" s={settings} set={setSetting} />
        <Toggle k="notifComments" label="Komentar" desc="Saat ada komentar baru" s={settings} set={setSetting} />
        <Toggle k="notifFollows" label="Pengikut baru" desc="Saat ada yang mengikutimu" s={settings} set={setSetting} />
      </Section>

      <Section icon={<ShieldCheck size={18} />} title="Privasi">
        <Toggle k="privateAccount" label="Akun privat" desc="Hanya pengikut yang bisa melihat postinganmu" s={settings} set={setSetting} />
        <Toggle k="showActivity" label="Status aktivitas" desc="Tampilkan saat kamu sedang aktif" s={settings} set={setSetting} />
      </Section>

      <Section icon={<UserCog size={18} />} title="Akun">
        <div className="flex items-center gap-3 px-1 py-2">
          <img src={me.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-zinc-500">@{me.username}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <RotateCcw size={16} /> Reset data demo
          </button>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </Section>

      <Section icon={<Info size={18} />} title="Tentang">
        <div className="px-1 py-1 text-sm text-zinc-500">
          <p>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">ChatLoop</span>{" "}
            versi 0.1.0
          </p>
          <p className="mt-1">Ngobrol, terhubung, tanpa henti. 🔄</p>
          <p className="mt-1 text-xs text-zinc-400">Dibuat dengan 💜 di Indonesia</p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
        <span className="text-fuchsia-600 dark:text-fuchsia-400">{icon}</span>
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-zinc-500">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-fuchsia-600" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

function Toggle({
  k,
  label,
  desc,
  s,
  set,
}: {
  k: keyof SettingsType;
  label: string;
  desc: string;
  s: SettingsType;
  set: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void;
}) {
  return <Row label={label} desc={desc} checked={s[k]} onChange={() => set(k, !s[k])} />;
}
