// Transições manuais permitidas (via AlterarSituacaoContratoService).
// ASSINADO só é atingido por RegistrarAssinaturaService (exige upload/tipo
// de assinatura) e RENOVADO só é atribuído por RenovarContratoService
// (ao contrato antigo, quando o novo é gerado) — nenhum dos dois é uma
// transição manual livre.
export const TRANSICOES_MANUAIS: Record<string, string[]> = {
  RASCUNHO: ["PENDENTE_ASSINATURA", "CANCELADO"],
  PENDENTE_ASSINATURA: ["RASCUNHO", "CANCELADO"],
  ASSINADO: ["ATIVO", "CANCELADO"],
  ATIVO: ["SUSPENSO", "CANCELADO", "ENCERRADO"],
  SUSPENSO: ["ATIVO", "CANCELADO", "ENCERRADO"],
  CANCELADO: [],
  ENCERRADO: [],
  RENOVADO: [],
};
