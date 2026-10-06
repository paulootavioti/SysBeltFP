import type { ReactNode } from "react";

import "./styles.css";

export type DegrauSituacao = "neutro" | "atencao" | "acao" | "inativo";

interface SituacaoProps {
  children: ReactNode;
  degrau?: DegrauSituacao;
  className?: string;
}

export function Situacao({ children, degrau = "neutro", className = "" }: SituacaoProps) {
  return <span className={`situacao situacao-${degrau} ${className}`.trim()}>{children}</span>;
}
