import type { Mensalidade } from "../types";
export function calcularStatusMensalidade(mensalidade: Mensalidade): "PENDENTE" | "VENCIDA" | "PAGA" {
  if (mensalidade.pago) {
    return "PAGA";
  }
  const vencimento = new Date(mensalidade.vencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (vencimento < hoje) {
    return "VENCIDA";
  }
  return "PENDENTE";
}