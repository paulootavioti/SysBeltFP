import type { Mensalidade } from "../types";

export function calcularStatusMensalidade(
  mensalidade: Mensalidade
): "PENDENTE" | "VENCIDA" | "PAGA" | "CANCELADA" | "ESTORNADA" {
  // CANCELADA/ESTORNADA são estados finais que só o backend registra — não
  // dá pra derivar de pago+vencimento, então respeitam o status vindo da API.
  if (mensalidade.status === "CANCELADA" || mensalidade.status === "ESTORNADA") {
    return mensalidade.status;
  }

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
