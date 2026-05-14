"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChatAppearance } from "@/lib/types";
import {
  COLOR_SCHEMES,
  DEFAULT_CHAT_APPEARANCE,
  schemeToAppearance,
} from "@/lib/chat-themes";
import Button from "@/components/ui/Button";

interface ChatSettingsPanelProps {
  appearance: ChatAppearance;
  onChange: (appearance: ChatAppearance) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const pickerValue = value.startsWith("#") ? value : "#111827";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-gray-600 cursor-pointer bg-transparent"
          title={label}
        />
        <span className="text-[10px] font-mono text-gray-500 w-16 truncate">{value}</span>
      </div>
    </div>
  );
}

export default function ChatSettingsPanel({
  appearance,
  onChange,
  isOpen,
  onClose,
  anchorRef,
}: ChatSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !position) return null;

  const update = (patch: Partial<ChatAppearance>) => {
    onChange({ ...appearance, presetId: "custom", ...patch });
  };

  const applyPreset = (schemeId: string) => {
    const scheme = COLOR_SCHEMES.find((s) => s.id === schemeId);
    if (!scheme) return;
    onChange({ ...schemeToAppearance(scheme), panelOpacity: appearance.panelOpacity });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_CHAT_APPEARANCE });
  };

  const panel = (
    <div
      ref={panelRef}
      className="fixed w-72 glass rounded-xl border border-white/10 shadow-2xl z-[200] p-5 animate-fade-slide max-h-[min(80vh,32rem)] overflow-y-auto thin-scrollbar"
      style={{ top: position.top, right: position.right }}
    >
      <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Giao diện chat
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Preset nhanh</div>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => applyPreset(scheme.id)}
              className={`w-9 h-9 rounded-lg border transition-all ${
                appearance.presetId === scheme.id
                  ? scheme.id === "stealth"
                    ? "ring-2 ring-gray-400 scale-105"
                    : "ring-2 ring-blue-500 scale-105"
                  : "border-gray-700 hover:border-gray-500"
              }`}
              title={scheme.id === "stealth" ? `${scheme.name} — kín đáo, ít nổi` : scheme.name}
              style={{ background: scheme.own }}
              aria-label={scheme.name}
            />
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          Chọn <span className="text-gray-400">Stealth</span> để bubble xám, khó bị phát hiện.
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Độ trong suốt panel</span>
          <span className="text-xs text-gray-500 font-mono">
            {Math.round(appearance.panelOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.05"
          value={appearance.panelOpacity}
          onChange={(e) => update({ panelOpacity: parseFloat(e.target.value) })}
          className="range-3d w-full"
        />
      </div>

      <div className="space-y-3 mb-5">
        <ColorField
          label="Nền panel"
          value={appearance.panelBg}
          onChange={(v) => update({ panelBg: v })}
        />
        <ColorField
          label="Nền vùng tin nhắn"
          value={appearance.messagesBg}
          onChange={(v) => update({ messagesBg: v })}
        />
        <ColorField
          label="Chữ panel"
          value={appearance.panelText}
          onChange={(v) => update({ panelText: v })}
        />
        <ColorField
          label="Chữ tin của tôi"
          value={appearance.ownText.startsWith("#") ? appearance.ownText : "#ffffff"}
          onChange={(v) => update({ ownText: v })}
        />
        <ColorField
          label="Chữ tin người khác"
          value={appearance.otherText.startsWith("#") ? appearance.otherText : "#e5e7eb"}
          onChange={(v) => update({ otherText: v })}
        />
        <ColorField
          label="Bubble của tôi"
          value={appearance.ownBubble.startsWith("#") ? appearance.ownBubble : "#3b82f6"}
          onChange={(v) => update({ ownBubble: v })}
        />
        <ColorField
          label="Bubble người khác"
          value={appearance.otherBubble.startsWith("#") ? appearance.otherBubble : "#1f2937"}
          onChange={(v) => update({ otherBubble: v })}
        />
      </div>

      <Button variant="ghost" fullWidth onClick={handleReset}>
        Đặt lại mặc định
      </Button>
    </div>
  );

  return createPortal(panel, document.body);
}
