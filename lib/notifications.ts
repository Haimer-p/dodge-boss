export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

let audioCtx: AudioContext | null = null;

export function playNewMessageSound(): void {
  if (typeof window === "undefined") return;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 784;
    osc.type = "sine";
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch {
    // ignore
  }
}

export function showBrowserNotification(
  title: string,
  body: string,
  onClick?: () => void,
  options?: { onlyWhenHidden?: boolean }
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (options?.onlyWhenHidden !== false && !document.hidden) return;

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
