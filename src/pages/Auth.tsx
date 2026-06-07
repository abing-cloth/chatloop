import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useStore } from "../lib/store";
import { COUNTRIES } from "../lib/countries";
import { asset } from "../lib/utils";
import { VerifiedBadge } from "../components/VerifiedBadge";

type Mode = "login" | "register";
type Method = "phone" | "email";
type Step = "form" | "otp";

function genOtp() {
  let s = "";
  for (let i = 0; i < 6; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function Auth() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const findByUsername = useStore((s) => s.findByUsername);

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<Method>("phone");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [dial, setDial] = useState(COUNTRIES[0].dial);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const contact = method === "phone" ? `${dial} ${phone.trim()}` : email.trim();

  function reset() {
    setStep("form");
    setOtp("");
    setSentCode("");
    setPendingUserId(null);
    setError("");
  }

  function sendCode() {
    setError("");
    if (mode === "register") {
      if (!name.trim()) return setError("Nama tidak boleh kosong.");
      if (!username.trim()) return setError("Username tidak boleh kosong.");
      if (findByUsername(username)) return setError("Username sudah dipakai.");
    }
    if (method === "phone") {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 6) return setError("Nomor telepon tidak valid.");
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return setError("Format email tidak valid.");
    }

    if (mode === "login") {
      const u = findByUsername(username);
      if (!u) return setError("Akun tidak ditemukan. Daftar dulu atau pakai akun demo.");
      setPendingUserId(u.id);
    }

    setSentCode(genOtp());
    setStep("otp");
  }

  function verify() {
    setError("");
    if (otp.trim() !== sentCode) return setError("Kode verifikasi salah. Coba lagi.");
    if (mode === "register") {
      register({
        name,
        username,
        phone: method === "phone" ? contact : undefined,
        email: method === "email" ? contact : undefined,
      });
    } else if (pendingUserId) {
      login(pendingUserId);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 lg:flex-row dark:from-zinc-950 dark:via-zinc-950 dark:to-fuchsia-950/30">
      {/* branding */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto max-w-md lg:mx-0">
          <div className="flex items-center gap-3">
            <img src={asset("chatloop.svg")} alt="SUUCHAT" className="h-14 w-14" />
            <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
              SUUCHAT
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Ngobrol, terhubung, tanpa henti. 🔄
          </h1>
          <p className="mt-2 text-zinc-500">
            Ngobrol bareng teman, bagikan momen & cerita, dan tetap terhubung —
            semua dalam satu lingkaran.
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-sm text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>
              Demi <b>keamanan & privasi</b>, setiap akun wajib diverifikasi lewat
              nomor telepon atau email. Kontakmu tidak ditampilkan ke publik.
            </span>
          </div>
        </div>
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {step === "form" ? (
            <>
              <div className="mb-6 flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      reset();
                    }}
                    className={
                      "flex-1 rounded-full py-2 text-sm font-semibold transition " +
                      (mode === m
                        ? "bg-white text-fuchsia-700 shadow dark:bg-zinc-700 dark:text-fuchsia-300"
                        : "text-zinc-500")
                    }
                  >
                    {m === "login" ? "Masuk" : "Daftar"}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {mode === "register" && (
                  <>
                    <Field icon={<UserIcon size={18} />} value={name} onChange={setName} placeholder="Nama lengkap" />
                    <Field icon={<AtSign size={18} />} value={username} onChange={setUsername} placeholder="Username" />
                  </>
                )}
                {mode === "login" && (
                  <Field icon={<AtSign size={18} />} value={username} onChange={setUsername} placeholder="Username" onEnter={sendCode} />
                )}

                {/* pilih metode verifikasi */}
                <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                  <button
                    onClick={() => setMethod("phone")}
                    className={
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition " +
                      (method === "phone" ? "bg-white text-fuchsia-700 shadow dark:bg-zinc-700 dark:text-fuchsia-300" : "text-zinc-500")
                    }
                  >
                    <Phone size={14} /> Telepon
                  </button>
                  <button
                    onClick={() => setMethod("email")}
                    className={
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition " +
                      (method === "email" ? "bg-white text-fuchsia-700 shadow dark:bg-zinc-700 dark:text-fuchsia-300" : "text-zinc-500")
                    }
                  >
                    <Mail size={14} /> Email
                  </button>
                </div>

                {method === "phone" ? (
                  <div className="flex gap-2">
                    <select
                      value={dial}
                      onChange={(e) => setDial(e.target.value)}
                      className="w-28 shrink-0 rounded-xl bg-zinc-100 px-2 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && sendCode()}
                      inputMode="numeric"
                      placeholder="812xxxxxxx"
                      className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
                    />
                  </div>
                ) : (
                  <Field icon={<Mail size={18} />} value={email} onChange={setEmail} placeholder="email@contoh.com" type="email" onEnter={sendCode} />
                )}
              </div>

              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

              <button
                onClick={sendCode}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Kirim Kode Verifikasi <ArrowRight size={16} />
              </button>

              <div className="mt-6">
                <p className="mb-2 text-center text-xs text-zinc-400">
                  atau masuk cepat sebagai akun demo (sudah terverifikasi)
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => login(u.id)}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pl-1 pr-3 text-xs font-medium text-zinc-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-fuchsia-950/40"
                    >
                      <img src={u.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      {u.name}
                      <VerifiedBadge size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* === LANGKAH OTP === */
            <div>
              <button
                onClick={() => setStep("form")}
                className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <ArrowLeft size={16} /> Kembali
              </button>

              <div className="mb-4 grid place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400">
                  <ShieldCheck size={28} />
                </div>
              </div>
              <h3 className="text-center text-lg font-bold">Verifikasi {method === "phone" ? "Nomor" : "Email"}</h3>
              <p className="mt-1 text-center text-sm text-zinc-500">
                Kode 6 digit dikirim ke
                <br />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{contact}</span>
              </p>

              {/* simulasi pengiriman kode (mode demo tanpa backend) */}
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm dark:bg-amber-950/40">
                <span className="text-amber-700 dark:text-amber-400">Kode demo: </span>
                <span className="font-mono text-lg font-bold tracking-widest text-amber-800 dark:text-amber-300">
                  {sentCode}
                </span>
                <button
                  onClick={() => setOtp(sentCode)}
                  className="mt-1 block w-full text-xs text-amber-600 underline dark:text-amber-400"
                >
                  Isi otomatis
                </button>
              </div>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                inputMode="numeric"
                placeholder="------"
                className="mt-4 w-full rounded-xl bg-zinc-100 py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
              />

              {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

              <button
                onClick={verify}
                disabled={otp.length !== 6}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
              >
                Verifikasi & {mode === "register" ? "Daftar" : "Masuk"} <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setSentCode(genOtp())}
                className="mt-3 w-full text-center text-xs text-fuchsia-600 hover:underline dark:text-fuchsia-400"
              >
                Kirim ulang kode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  onEnter,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="w-full rounded-xl bg-zinc-100 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
      />
    </div>
  );
}
