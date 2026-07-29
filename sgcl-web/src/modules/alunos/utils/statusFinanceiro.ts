import type { Mensalidade } from "../../mensalidades/types/mensalidade";
import { calcularStatusMensalidade } from "../../mensalidades/utils/status";

export type StatusFinanceiroAluno = "PAGO" | "PENDENTE" | "VENCIDO" | null;

// Mensalidades canceladas/estornadas não contam pro status financeiro
// geral do aluno — são dívidas que deixaram de existir, não pendências.
export function calcularStatusFinanceiroAluno(mensalidades?: Mensalidade[]): StatusFinanceiroAluno {
  if (!mensalidades || mensalidades.length === 0) return null;

  const status = mensalidades
    .map(calcularStatusMensalidade)
    .filter((s) => s !== "CANCELADA" && s !== "ESTORNADA");

  if (status.length === 0) return null;

  if (status.includes("VENCIDA")) return "VENCIDO";
  if (status.includes("PENDENTE")) return "PENDENTE";
  return "PAGO";
}
