import { ChatAppearance } from "@/lib/types";

export interface ChatColorScheme {
  id: string;
  name: string;
  panelBg: string;
  messagesBg: string;
  panelText: string;
  own: string;
  other: string;
  ownText: string;
  otherText: string;
  ownName: string;
  otherName: string;
  time: string;
}

export const COLOR_SCHEMES: ChatColorScheme[] = [
  {
    id: "stealth",
    name: "Stealth",
    panelBg: "#0c0c10",
    messagesBg: "#030712",
    panelText: "#9ca3af",
    own: "#1f2937",
    other: "#111827",
    ownText: "#d1d5db",
    otherText: "#9ca3af",
    ownName: "#6b7280",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.35)",
  },
  {
    id: "default",
    name: "Default",
    panelBg: "#111827",
    messagesBg: "#111827",
    panelText: "#e5e7eb",
    own: "linear-gradient(135deg, #3b82f6, #6366f1)",
    other: "#1f2937",
    ownText: "#ffffff",
    otherText: "#e5e7eb",
    ownName: "#60a5fa",
    otherName: "#60a5fa",
    time: "rgba(255,255,255,0.6)",
  },
  {
    id: "mono",
    name: "Monochrome",
    panelBg: "#111827",
    messagesBg: "#0f1419",
    panelText: "#d1d5db",
    own: "#374151",
    other: "#1f2937",
    ownText: "#d1d5db",
    otherText: "#9ca3af",
    ownName: "#9ca3af",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.45)",
  },
  {
    id: "green",
    name: "Forest",
    panelBg: "#052e16",
    messagesBg: "#022c22",
    panelText: "#d1fae5",
    own: "linear-gradient(135deg, #059669, #10b981)",
    other: "#064e3b",
    ownText: "#ffffff",
    otherText: "#a7f3d0",
    ownName: "#34d399",
    otherName: "#34d399",
    time: "rgba(255,255,255,0.6)",
  },
  {
    id: "purple",
    name: "Night Sky",
    panelBg: "#1e1b4b",
    messagesBg: "#1a1744",
    panelText: "#ede9fe",
    own: "linear-gradient(135deg, #7c3aed, #a855f7)",
    other: "#2e1065",
    ownText: "#ffffff",
    otherText: "#e9d5ff",
    ownName: "#c084fc",
    otherName: "#c084fc",
    time: "rgba(255,255,255,0.6)",
  },
  {
    id: "warm",
    name: "Warm",
    panelBg: "#1c1917",
    messagesBg: "#171412",
    panelText: "#fef3c7",
    own: "linear-gradient(135deg, #d97706, #f59e0b)",
    other: "#451a03",
    ownText: "#ffffff",
    otherText: "#fde68a",
    ownName: "#fbbf24",
    otherName: "#fbbf24",
    time: "rgba(255,255,255,0.6)",
  },
  {
    id: "minimal",
    name: "Minimal",
    panelBg: "#0f172a",
    messagesBg: "#0b1120",
    panelText: "#cbd5e1",
    own: "rgba(255,255,255,0.1)",
    other: "rgba(255,255,255,0.06)",
    ownText: "#cbd5e1",
    otherText: "#9ca3af",
    ownName: "#6b7280",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.4)",
  },
  {
    id: "retro",
    name: "Retro",
    panelBg: "#0f172a",
    messagesBg: "#0c1222",
    panelText: "#e2e8f0",
    own: "#2563eb",
    other: "#1e293b",
    ownText: "#ffffff",
    otherText: "#cbd5e1",
    ownName: "#3b82f6",
    otherName: "#94a3b8",
    time: "rgba(255,255,255,0.55)",
  },
  {
    id: "cyber",
    name: "Cyber",
    panelBg: "#083344",
    messagesBg: "#062a38",
    panelText: "#cffafe",
    own: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    other: "#083344",
    ownText: "#000000",
    otherText: "#67e8f9",
    ownName: "#22d3ee",
    otherName: "#22d3ee",
    time: "rgba(255,255,255,0.55)",
  },
];

const STEALTH_SCHEME = COLOR_SCHEMES[0];

export const DEFAULT_CHAT_APPEARANCE: ChatAppearance = {
  presetId: STEALTH_SCHEME.id,
  panelBg: STEALTH_SCHEME.panelBg,
  messagesBg: STEALTH_SCHEME.messagesBg,
  panelText: STEALTH_SCHEME.panelText,
  panelOpacity: 1,
  ownBubble: STEALTH_SCHEME.own,
  otherBubble: STEALTH_SCHEME.other,
  ownText: STEALTH_SCHEME.ownText,
  otherText: STEALTH_SCHEME.otherText,
  ownName: STEALTH_SCHEME.ownName,
  otherName: STEALTH_SCHEME.otherName,
  timeColor: STEALTH_SCHEME.time,
};

export function schemeToAppearance(scheme: ChatColorScheme): ChatAppearance {
  return {
    presetId: scheme.id,
    panelBg: scheme.panelBg,
    messagesBg: scheme.messagesBg,
    panelText: scheme.panelText,
    panelOpacity: 1,
    ownBubble: scheme.own,
    otherBubble: scheme.other,
    ownText: scheme.ownText,
    otherText: scheme.otherText,
    ownName: scheme.ownName,
    otherName: scheme.otherName,
    timeColor: scheme.time,
  };
}

/** Apply opacity to hex colors; passes through gradients/rgba unchanged. */
export function withOpacity(color: string, opacity: number): string {
  if (opacity >= 1) return color;
  if (color.startsWith("linear-gradient") || color.startsWith("rgba")) return color;
  const hex = color.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return color;
  const full =
    hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function loadChatAppearance(): ChatAppearance {
  if (typeof window === "undefined") return DEFAULT_CHAT_APPEARANCE;

  const saved = localStorage.getItem("dodgeboss:chatAppearance");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<ChatAppearance>;
      const merged = { ...DEFAULT_CHAT_APPEARANCE, ...parsed };
      if (!parsed.messagesBg) {
        merged.messagesBg = parsed.panelBg ?? DEFAULT_CHAT_APPEARANCE.messagesBg;
      }
      return merged;
    } catch {
      // fall through
    }
  }

  const legacy = localStorage.getItem("dodgeboss:chatColor");
  if (legacy) {
    const found = COLOR_SCHEMES.find((c) => c.id === legacy);
    if (found) return schemeToAppearance(found);
  }

  return DEFAULT_CHAT_APPEARANCE;
}

export function saveChatAppearance(appearance: ChatAppearance) {
  localStorage.setItem("dodgeboss:chatAppearance", JSON.stringify(appearance));
}
