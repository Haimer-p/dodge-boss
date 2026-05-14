"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_CATEGORIES } from "@/lib/emojis";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const category = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) ?? EMOJI_CATEGORIES[0];

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 glass rounded-xl border border-white/15 shadow-xl z-50 overflow-hidden"
    >
      <div className="flex gap-0.5 p-1.5 border-b border-white/10 overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-2 py-1 text-[10px] rounded-lg transition-colors ${
              activeCategory === cat.id
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-40 overflow-y-auto thin-scrollbar">
        {category.emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => {
              onSelect(emoji);
            }}
            className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
