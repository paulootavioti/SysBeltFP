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

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}