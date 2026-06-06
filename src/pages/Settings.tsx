import { useState } from "react";
import {
  BadgeCheck,
  Bell,
  Download,
  Fingerprint,
  Info,
  Lock,
  LogOut,
  Moon,
  RotateCcw,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { Settings as SettingsType } from "../lib/store";
import { cn } from "../lib/utils";
import { InstallButton } from "../components/InstallButton";
import { biometricAvailable, registerBiometric } from "../lib/biometric";
import { useT } from "../lib/i18n";
import { requestNotifPermission, showNotif } from "../lib/notify";

export function Settings() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetAll);
  const me = useStore((s) => s.me());
  const tr = useT();

  const [pinModal, setPinModal] = useState(false);
  const [bioMsg, setBioMsg] = useState("");

  async function togglePush() {
    if (settings.pushEnabled) {
      setSetting("pushEnabled", false);
      return;
    }
    const ok = await requestNotifPermission();
    setSetting("pushEnabled", ok);
    if (ok) showNotif("ChatLoop 🔔", "Notifikasi aktif! Kamu akan dapat kabar terbaru.");
  }

  async function toggleAppLock() {
    if (settings.appLockEnabled) {
      setSetting("appLockEnabled", false);
      setSetting("pin", null);
      setSetting("biometricEnabled", false);
      setSetting("biometricCredId", null);
    } else {
      setPinModal(true); // minta set PIN dulu
    }
  }

  function savePin(pin: string) {
    setSetting("pin", pin);
    setSetting("appLockEnabled", true);
    setPinModal(false);
  }

  async function toggleBiometric() {
    setBioMsg("");
    if (settings.biometricEnabled) {
      setSetting("biometricEnabled", false);
      setSetting("biometricCredId", null);
      return;
    }
    if (!(await biometricAvailable())) {
      setBioMsg("Perangkat ini tidak mendukung biometrik (atau bukan HTTPS/localhost).");
      return;
    }
    const credId = await registerBiometric(me.username || "chatloop-user");
    if (credId) {
      setSetting("biometricCredId", credId);
      setSetting("biometricEnabled", true);
    } else {
      setBioMsg("Pendaftaran biometrik dibatalkan atau gagal.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <h2 className="px-1 text-lg font-bold">Pengaturan</h2>

      <Section icon={<Moon size={18} />} title={tr("set.appearance")}>
        <Row
          label={tr("set.darkmode")}
          desc={tr("set.darkmodeDesc")}
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
        <div className="px-1 py-2">
          <p className="text-sm font-medium">{tr("set.language")}</p>
          <div className="mt-2 flex gap-2">
            {([["id", "🇮🇩 Indonesia"], ["en", "🇬🇧 English"]] as const).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setSetting("lang", code)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  settings.lang === code ? "bg-fuchsia-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Toggle k="dataSaver" label={tr("set.dataSaver")} desc={tr("set.dataSaverDesc")} s={settings} set={setSetting} />
      </Section>

      <Section icon={<BadgeCheck size={18} />} title="Kreator & Verifikasi">
        <div className="flex items-center justify-between gap-3 px-1 py-2">
          <div className="flex items-center gap-2">
            <BadgeCheck size={18} className="fill-sky-500 text-white" />
            <div>
              <p className="text-sm font-medium">Status verifikasi</p>
              <p className="text-xs text-zinc-500">{me.verified ? "Akun terverifikasi ✓" : "Belum terverifikasi"}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{me.verified ? "Aktif" : "—"}</span>
        </div>
        <Toggle k="creatorMode" label="Mode Kreator" desc="Akses insight & alat kreator" s={settings} set={setSetting} />
      </Section>

      <Section icon={<Download size={18} />} title="Aplikasi">
        <div className="px-1 py-1">
          <p className="mb-3 text-sm text-zinc-500">
            Pasang ChatLoop sebagai aplikasi — buka langsung dari layar utama,
            tampil layar penuh, dan bisa dipakai offline.
          </p>
          <InstallButton className="w-full" />
        </div>
      </Section>

      <Section icon={<Bell size={18} />} title={tr("set.notifications")}>
        <Row label={tr("set.push")} desc={tr("set.pushDesc")} checked={settings.pushEnabled} onChange={togglePush} />
        {settings.pushEnabled && (
          <button
            onClick={() => showNotif("ChatLoop 🔔", "Ini contoh notifikasi dari ChatLoop!")}
            className="mb-1 ml-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Kirim notifikasi contoh
          </button>
        )}
        <Toggle k="notifLikes" label="Suka" desc="Saat ada yang menyukai postinganmu" s={settings} set={setSetting} />
        <Toggle k="notifComments" label="Komentar" desc="Saat ada komentar baru" s={settings} set={setSetting} />
        <Toggle k="notifFollows" label="Pengikut baru" desc="Saat ada yang mengikutimu" s={settings} set={setSetting} />
        <Toggle k="notifLive" label="Teman mulai Live" desc="Saat teman memulai siaran langsung" s={settings} set={setSetting} />
      </Section>

      <Section icon={<ShieldCheck size={18} />} title="Privasi">
        <Toggle k="privateAccount" label="Akun privat" desc="Hanya pengikut yang bisa melihat postinganmu" s={settings} set={setSetting} />
        <Toggle k="showActivity" label="Status aktivitas" desc="Tampilkan saat kamu sedang aktif" s={settings} set={setSetting} />
      </Section>

      <Section icon={<Lock size={18} />} title="Keamanan">
        <Row
          label="Kunci aplikasi (PIN)"
          desc="Minta PIN saat membuka ChatLoop"
          checked={settings.appLockEnabled}
          onChange={toggleAppLock}
        />
        {settings.appLockEnabled && (
          <>
            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <div>
                <p className="text-sm font-medium">Ubah PIN</p>
                <p className="text-xs text-zinc-500">Ganti PIN 6 digit</p>
              </div>
              <button
                onClick={() => setPinModal(true)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Ubah
              </button>
            </div>

            <div className="px-1 py-2">
              <p className="text-sm font-medium">Kunci otomatis</p>
              <p className="mb-2 text-xs text-zinc-500">Kunci setelah tidak aktif</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 0, l: "Saat dibuka" },
                  { v: 1, l: "1 menit" },
                  { v: 5, l: "5 menit" },
                  { v: 15, l: "15 menit" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setSetting("autoLockMinutes", o.v)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      settings.autoLockMinutes === o.v
                        ? "bg-fuchsia-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <div className="flex items-center gap-2">
                <Fingerprint size={18} className="text-fuchsia-600 dark:text-fuchsia-400" />
                <div>
                  <p className="text-sm font-medium">Buka dengan biometrik</p>
                  <p className="text-xs text-zinc-500">Sidik jari / Face ID perangkat</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={settings.biometricEnabled}
                onClick={toggleBiometric}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition",
                  settings.biometricEnabled ? "bg-fuchsia-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                    settings.biometricEnabled ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
            {bioMsg && <p className="px-1 pb-1 text-xs text-amber-600 dark:text-amber-400">{bioMsg}</p>}
          </>
        )}
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

      {pinModal && <PinModal onSave={savePin} onClose={() => setPinModal(false)} />}
    </div>
  );
}

function PinModal({
  onSave,
  onClose,
}: {
  onSave: (pin: string) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [first, setFirst] = useState("");
  const [val, setVal] = useState("");
  const [error, setError] = useState("");

  function onChange(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 6);
    setVal(clean);
    setError("");
    if (clean.length === 6) {
      if (stage === "enter") {
        setFirst(clean);
        setStage("confirm");
        setVal("");
      } else {
        if (clean === first) onSave(clean);
        else {
          setError("PIN tidak cocok. Ulangi.");
          setStage("enter");
          setFirst("");
          setVal("");
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Lock size={16} className="text-fuchsia-600" />{" "}
            {stage === "enter" ? "Buat PIN" : "Konfirmasi PIN"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          {stage === "enter" ? "Masukkan 6 digit PIN baru" : "Masukkan ulang PIN tadi"}
        </p>
        <input
          autoFocus
          value={val}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          placeholder="------"
          className="w-full rounded-xl bg-zinc-100 py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
        />
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
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

type BoolSettingKey = {
  [K in keyof SettingsType]: SettingsType[K] extends boolean ? K : never;
}[keyof SettingsType];

function Toggle({
  k,
  label,
  desc,
  s,
  set,
}: {
  k: BoolSettingKey;
  label: string;
  desc: string;
  s: SettingsType;
  set: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void;
}) {
  return <Row label={label} desc={desc} checked={s[k]} onChange={() => set(k, !s[k])} />;
}
