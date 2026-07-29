import { AppError } from "../../../shared/errors/AppError";
import { gerarCsv } from "../utils/exportarCsv";
import type { FiltrosFinanceiro } from "../utils/filtros";
import { GetContasAReceberService } from "./GetContasAReceberService";
import { GetContasPagasService } from "./GetContasPagasService";
import { GetContasVencidasService } from "./GetContasVencidasService";
import { GetCobrancasCanceladasService } from "./GetCobrancasCanceladasService";
import { GetEstornosService } from "./GetEstornosService";

export const TIPOS_EXPORTACAO = ["RECEBER", "PAGAS", "VENCIDAS", "CANCELADAS", "ESTORNOS"] as const;
export type TipoExportacao = (typeof TIPOS_EXPORTACAO)[number];

const SERVICOS: Record<TipoExportacao, { execute(unidadeId: number | null, filtros: FiltrosFinanceiro): Promise<unknown[]> }> = {
  RECEBER: new GetContasAReceberService(),
  PAGAS: new GetContasPagasService(),
  VENCIDAS: new GetContasVencidasService(),
  CANCELADAS: new GetCobrancasCanceladasService(),
  ESTORNOS: new GetEstornosService(),
};

interface MensalidadeExportavel {
  id: number;
  aluno: { nome: string };
  valor: number;
  valorFinal: number;
  vencimento: Date;
  dataPagamento: Date | null;
  status: string;
}

export class ExportarRelatorioService {
  async execute(tipo: TipoExportacao, unidadeId: number | null, filtros: FiltrosFinanceiro = {}) {
    const servico = SERVICOS[tipo];

    if (!servico) {
      throw new AppError("Tipo de exportação inválido.");
    }

    const mensalidades = (await servico.execute(unidadeId, filtros)) as MensalidadeExportavel[];

    const linhas = mensalidades.map((m) => ({
      id: m.id,
      aluno: m.aluno.nome,
      valorOriginal: m.valor,
      valorFinal: m.valorFinal,
      vencimento: m.vencimento,
      dataPagamento: m.dataPagamento,
      status: m.status,
    }));

    return gerarCsv(linhas, [
      { chave: "id", rotulo: "ID" },
      { chave: "aluno", rotulo: "Aluno" },
      { chave: "valorOriginal", rotulo: "Valor Original" },
      { chave: "valorFinal", rotulo: "Valor Final" },
      { chave: "vencimento", rotulo: "Vencimento" },
      { chave: "dataPagamento", rotulo: "Data de Pagamento" },
      { chave: "status", rotulo: "Status" },
    ]);
  }
}
