import { useState } from "react";
import { ArrowRight, AtSign, Lock, User as UserIcon } from "lucide-react";
import { useStore } from "../lib/store";

export function Auth() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (mode === "login") {
      const u = users.find(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!u) {
        setError("Akun tidak ditemukan. Coba daftar dulu atau pilih akun demo.");
        return;
      }
      login(u.id);
    } else {
      if (!name.trim()) return setError("Nama tidak boleh kosong.");
      if (!username.trim()) return setError("Username tidak boleh kosong.");
      const exists = users.some(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) return setError("Username sudah dipakai.");
      register({ name, username });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 lg:flex-row dark:from-zinc-950 dark:via-zinc-950 dark:to-fuchsia-950/30">
      {/* sisi kiri — branding */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto max-w-md lg:mx-0">
          <div className="flex items-center gap-3">
            <img src="/chatloop.svg" alt="ChatLoop" className="h-14 w-14" />
            <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
              ChatLoop
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Ngobrol, terhubung, tanpa henti. 🔄
          </h1>
          <p className="mt-2 text-zinc-500">
            Ngobrol bareng teman, bagikan momen & cerita, dan tetap terhubung —
            semua dalam satu lingkaran.
          </p>
        </div>
      </div>

      {/* sisi kanan — form */}
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* tab */}
          <div className="mb-6 flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
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
              <Field
                icon={<UserIcon size={18} />}
                value={name}
                onChange={setName}
                placeholder="Nama lengkap"
              />
            )}
            <Field
              icon={<AtSign size={18} />}
              value={username}
              onChange={setUsername}
              placeholder="Username"
              onEnter={submit}
            />
            <Field
              icon={<Lock size={18} />}
              value=""
              onChange={() => {}}
              placeholder="Kata sandi (demo — bebas)"
              type="password"
              onEnter={submit}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <button
            onClick={submit}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {mode === "login" ? "Masuk" : "Buat Akun"} <ArrowRight size={16} />
          </button>

          {/* login cepat akun demo */}
          <div className="mt-6">
            <p className="mb-2 text-center text-xs text-zinc-400">
              atau masuk cepat sebagai akun demo
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => login(u.id)}
                  className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 text-xs font-medium text-zinc-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-fuchsia-950/40"
                >
                  <img src={u.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>
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
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
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
