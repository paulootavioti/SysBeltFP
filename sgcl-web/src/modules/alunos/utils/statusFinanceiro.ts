import type { Mensalidade } from "../../mensalidades/types/mensalidade";
import { calcularStatusMensalidade } from "../../mensalidades/utils/status";

export type StatusFinanceiroAluno = "PAGO" | "PENDENTE" | "VENCIDO" | null;

export function calcularStatusFinanceiroAluno(mensalidades?: Mensalidade[]): StatusFinanceiroAluno {
  if (!mensalidades || mensalidades.length === 0) return null;

  const status = mensalidades.map(calcularStatusMensalidade);

  if (status.includes("VENCIDA")) return "VENCIDO";
  if (status.includes("PENDENTE")) return "PENDENTE";
  return "PAGO";
}