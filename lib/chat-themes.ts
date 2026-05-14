import { ChatAppearance } from "@/lib/types";

export interface ChatColorScheme {
  id: string;
  name: string;
  panelBg: string;
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
    id: "default",
    name: "Default",
    panelBg: "#111827",
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
    panelText: "#cbd5e1",
    own: "rgba(59,130,246,0.2)",
    other: "rgba(255,255,255,0.08)",
    ownText: "#93c5fd",
    otherText: "#9ca3af",
    ownName: "#60a5fa",
    otherName: "#6b7280",
    time: "rgba(255,255,255,0.45)",
  },
  {
    id: "retro",
    name: "Retro",
    panelBg: "#0f172a",
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

export const DEFAULT_CHAT_APPEARANCE: ChatAppearance = {
  presetId: "default",
  panelBg: COLOR_SCHEMES[0].panelBg,
  panelText: COLOR_SCHEMES[0].panelText,
  panelOpacity: 1,
  ownBubble: COLOR_SCHEMES[0].own,
  otherBubble: COLOR_SCHEMES[0].other,
  ownText: COLOR_SCHEMES[0].ownText,
  otherText: COLOR_SCHEMES[0].otherText,
  ownName: COLOR_SCHEMES[0].ownName,
  otherName: COLOR_SCHEMES[0].otherName,
  timeColor: COLOR_SCHEMES[0].time,
};

export function schemeToAppearance(scheme: ChatColorScheme): ChatAppearance {
  return {
    presetId: scheme.id,
    panelBg: scheme.panelBg,
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

export function loadChatAppearance(): ChatAppearance {
  if (typeof window === "undefined") return DEFAULT_CHAT_APPEARANCE;

  const saved = localStorage.getItem("dodgeboss:chatAppearance");
  if (saved) {
    try {
      return { ...DEFAULT_CHAT_APPEARANCE, ...JSON.parse(saved) };
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
