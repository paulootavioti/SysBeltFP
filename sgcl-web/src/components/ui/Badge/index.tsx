import type { ReactNode } from "react";
import { Situacao, type DegrauSituacao } from "../Situacao";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
}

export function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  const degrau: Record<NonNullable<BadgeProps["variant"]>, DegrauSituacao> = {
    success: "neutro", danger: "acao", warning: "atencao", info: "neutro", neutral: "neutro",
  };
  return <Situacao degrau={degrau[variant]}>{children}</Situacao>;
}
