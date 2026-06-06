import { formatRupiah } from "./utils";

export interface Voucher {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min: number;
  label: string;
}

export const VOUCHERS: Voucher[] = [
  { code: "HEMAT10", type: "percent", value: 10, min: 0, label: "Diskon 10%" },
  { code: "NEWUSER", type: "percent", value: 15, min: 0, label: "Diskon 15% pengguna baru" },
  { code: "DISKON50K", type: "fixed", value: 50000, min: 150000, label: "Potongan Rp50.000 (min Rp150rb)" },
];

export function applyVoucher(
  code: string,
  subtotal: number
): { ok: boolean; discount: number; msg: string } {
  const v = VOUCHERS.find((x) => x.code === code.trim().toUpperCase());
  if (!v) return { ok: false, discount: 0, msg: "Kode voucher tidak valid." };
  if (subtotal < v.min)
    return { ok: false, discount: 0, msg: `Min. belanja ${formatRupiah(v.min)}.` };
  const d = v.type === "percent" ? Math.round((subtotal * v.value) / 100) : v.value;
  return { ok: true, discount: Math.min(d, subtotal), msg: `${v.label} diterapkan! 🎉` };
}
