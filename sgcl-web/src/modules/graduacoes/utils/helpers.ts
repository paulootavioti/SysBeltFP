import { FAIXAS } from "../types";

export function getProximaFaixa(faixaAtual: string): string | null {
  const indice = FAIXAS.indexOf(faixaAtual);
  if (indice === -1 || indice === FAIXAS.length - 1) {
    return null;
  }
  return FAIXAS[indice + 1];
}

export function getIndiceFaixa(faixa: string): number {
  return FAIXAS.indexOf(faixa);
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function getApiErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
