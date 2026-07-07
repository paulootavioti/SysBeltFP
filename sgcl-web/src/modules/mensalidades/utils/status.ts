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

export function formatarStatusMensalidade(status: string): string {
  const statusMap: Record<string, string> = {
    PENDENTE: "Pendente",
    VENCIDA: "Vencida",
    PAGA: "Paga",
  };
  return statusMap[status] || status;
}

export function corStatusMensalidade(status: string): string {
  const corMap: Record<string, string> = {
    PENDENTE: "bg-yellow-100 text-yellow-800",
    VENCIDA: "bg-red-100 text-red-800",
    PAGA: "bg-green-100 text-green-800",
  };
  return corMap[status] || "bg-gray-100 text-gray-800";
}
