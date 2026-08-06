import { formatarDataBR } from "../../../shared/utils/dataCalendario";

interface ColunaCsv<T> {
  chave: keyof T;
  rotulo: string;
}

function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";

  // vencimento e data de pagamento são datas de calendário — sem o fuso
  // fixo, a planilha exportada no Brasil sai com todo dia deslocado.
  const texto = valor instanceof Date ? formatarDataBR(valor) : String(valor);

  if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replace(/"/g, '""')}"`;
  }

  return texto;
}

// Exportação simples, sem dependência nova (não há gerador de PDF
// instalado no projeto) — devolve uma string CSV pronta pra download.
export function gerarCsv<T extends Record<string, unknown>>(linhas: T[], colunas: ColunaCsv<T>[]): string {
  const cabecalho = colunas.map((coluna) => escaparCsv(coluna.rotulo)).join(";");
  const corpo = linhas.map((linha) => colunas.map((coluna) => escaparCsv(linha[coluna.chave])).join(";"));

  return [cabecalho, ...corpo].join("\n");
}
