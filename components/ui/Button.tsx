"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "ghost" | "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  ghost:
    "text-gray-400 bg-gray-800/50 hover:bg-gray-800 hover:text-gray-200",
  primary:
    "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-500/20",
  secondary:
    "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", fullWidth = false, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
