"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonVariant = "ghost" | "primary" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  "aria-label": string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    "text-gray-400 hover:text-gray-200 hover:bg-white/10 active:bg-white/15",
  primary:
    "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-500/20 disabled:from-gray-700 disabled:to-gray-700 disabled:shadow-none",
  danger: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", className = "", children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
