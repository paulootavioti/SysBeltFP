import { FAIXAS_INFANTIL } from "../types";

export function getProximaFaixa(faixaAtual: string): string | null {
  const indice = FAIXAS_INFANTIL.indexOf(faixaAtual);
  if (indice === -1 || indice === FAIXAS_INFANTIL.length - 1) {
    return null;
  }
  return FAIXAS_INFANTIL[indice + 1];
}

export function getIndiceFaixa(faixa: string): number {
  return FAIXAS_INFANTIL.indexOf(faixa);
}

// Reexporta o formatador compartilhado pra não quebrar quem já importa
// `formatarData` daqui — a implementação vive em shared/utils.
export { formatarData } from "../../../shared/utils/formatarData";

const DIA_EM_MS = 1000 * 60 * 60 * 24;

// `agora` é recebido de fora (em vez de sempre chamar Date.now() aqui
// dentro) pra permitir memoizar um único instante de referência e reusar
// em várias linhas de uma tabela, sem recalcular nem gerar timestamps
// levemente diferentes entre uma linha e outra.
export function formatarTempoRelativo(data: string, agora: number = Date.now()): string {
  const dias = Math.floor((agora - new Date(data).getTime()) / DIA_EM_MS);

  if (dias <= 0) return "hoje";
  if (dias === 1) return "1 dia atrás";
  if (dias < 30) return `${dias} dias atrás`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? "há 1 mês" : `há ${meses} meses`;

  const anos = Math.floor(dias / 365);
  return anos === 1 ? "há 1 ano" : `há ${anos} anos`;
}