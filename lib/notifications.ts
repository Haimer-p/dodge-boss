export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  body: string,
  onClick?: () => void
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;

  try {
    const n = new Notification(title, {
      body: body.slice(0, 120),
      icon: "/favicon.ico",
      tag: "dodgeboss-chat",
    });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
  } catch {
    // ignore
  }
}

export function previewMessage(content: string, type?: string): string {
  if (type === "image") return "Đã gửi một hình ảnh";
  return content.length > 60 ? content.slice(0, 60) + "…" : content;
}
