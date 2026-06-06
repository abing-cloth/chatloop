import { asset } from "./utils";

export function notifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifPermission(): NotificationPermission {
  return notifySupported() ? Notification.permission : "denied";
}

export async function requestNotifPermission(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

/** Tampilkan notifikasi (lewat service worker bila ada, agar muncul juga saat PWA). */
export async function showNotif(title: string, body: string) {
  if (!notifySupported() || Notification.permission !== "granted") return;
  const options: NotificationOptions = {
    body,
    icon: asset("icon-192.png"),
    badge: asset("icon-192.png"),
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  } catch {
    try {
      new Notification(title, options);
    } catch {
      /* abaikan */
    }
  }
}
