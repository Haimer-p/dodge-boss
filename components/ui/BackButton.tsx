"use client";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  variant?: "dark" | "light";
}

export default function BackButton({
  onClick,
  label = "Back",
  className = "",
  variant = "dark",
}: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`btn-3d btn-3d-secondary inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl min-h-[40px] shrink-0 ${
        variant === "light" ? "!bg-gradient-to-b !from-[#f8f9fa] !to-[#e8eaed] !text-gray-700 !border-gray-300 !shadow-[0_3px_0_#dadce0]" : ""
      } ${className}`}
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5m7-7l-7 7 7 7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
