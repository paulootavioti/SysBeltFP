import type { ReactNode } from "react";

import "./styles.css";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
}

export function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}