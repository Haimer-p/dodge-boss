"use client";

import { useEffect, useRef } from "react";
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
}: ChatSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-2 w-72 glass rounded-xl border border-white/10 shadow-2xl z-50 p-4 animate-fade-slide"
    >
      <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Chat Appearance
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Theme Presets</div>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => applyPreset(scheme.id)}
              className={`w-9 h-9 rounded-lg border transition-all ${
                appearance.presetId === scheme.id
                  ? "ring-2 ring-blue-500 scale-105"
                  : "border-gray-700 hover:border-gray-500"
              }`}
              title={scheme.name}
              style={{ background: scheme.own }}
              aria-label={scheme.name}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Panel Opacity</span>
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

      <div className="space-y-2.5 mb-4">
        <ColorField
          label="Panel Background"
          value={appearance.panelBg}
          onChange={(v) => update({ panelBg: v })}
        />
        <ColorField
          label="Panel Text"
          value={appearance.panelText}
          onChange={(v) => update({ panelText: v })}
        />
        <ColorField
          label="My Message Text"
          value={appearance.ownText.startsWith("#") ? appearance.ownText : "#ffffff"}
          onChange={(v) => update({ ownText: v })}
        />
        <ColorField
          label="Other Message Text"
          value={appearance.otherText.startsWith("#") ? appearance.otherText : "#e5e7eb"}
          onChange={(v) => update({ otherText: v })}
        />
        <ColorField
          label="My Bubble"
          value={appearance.ownBubble.startsWith("#") ? appearance.ownBubble : "#3b82f6"}
          onChange={(v) => update({ ownBubble: v })}
        />
        <ColorField
          label="Other Bubble"
          value={appearance.otherBubble.startsWith("#") ? appearance.otherBubble : "#1f2937"}
          onChange={(v) => update({ otherBubble: v })}
        />
      </div>

      <Button variant="ghost" fullWidth onClick={handleReset}>
        Reset to Default
      </Button>
    </div>
  );
}
