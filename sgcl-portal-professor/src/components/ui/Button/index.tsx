import type { ButtonHTMLAttributes } from "react";
import "./styles.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "sm";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button-${variant} button-${size}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
