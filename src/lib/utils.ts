export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hr`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} mgg`;
  return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function formatSchedule(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `Hari ini, ${time}`;
  if (sameDay(d, tomorrow)) return `Besok, ${time}`;
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${time}`;
}

export function countdown(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "Segera";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} hari lagi`;
  if (h > 0) return `${h} jam ${m} mnt lagi`;
  return `${m} menit lagi`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function cn(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}
