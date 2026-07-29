import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { garantirSemMensalidadeNoMes } from "../../mensalidades/utils/garantirSemMensalidadeNoMes";
import { calcularValorFinal } from "../../mensalidades/utils/calcularValorFinal";
import { calcularVencimentoDoMes } from "../utils/calcularVencimentoDoMes";

export interface ResultadoGeracaoCobrancas {
  geradas: number;
  ignoradasPorDuplicidade: number;
  concluidas: number;
}

// Motor de geração de cobrança recorrente — pra cada Assinatura ATIVA,
// cria a Mensalidade do mês corrente se ela ainda não existir (idempotente:
// pode ser chamado várias vezes no mesmo mês sem duplicar). Chamado tanto
// pelo disparo externo (cron, sem unidadeId — roda pra todo mundo) quanto
// manualmente por um ADMIN (escopado à própria unidade).
export class GerarCobrancasRecorrentesService {
  async execute(unidadeId: number | null): Promise<ResultadoGeracaoCobrancas> {
    const hoje = new Date();

    const assinaturas = await prisma.assinatura.findMany({
      where: {
        status: "ATIVA",
        dataInicio: { lte: hoje },
        ...escopoUnidade(unidadeId),
      },
    });

    let geradas = 0;
    let ignoradasPorDuplicidade = 0;
    let concluidas = 0;

    for (const assinatura of assinaturas) {
      if (assinatura.dataFim && assinatura.dataFim < hoje) {
        await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "CONCLUIDA" } });
        concluidas++;
        continue;
      }

      if (
        !assinatura.indeterminado &&
        assinatura.numeroParcelas !== null &&
        assinatura.parcelasGeradas >= assinatura.numeroParcelas
      ) {
        await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "CONCLUIDA" } });
        concluidas++;
        continue;
      }

      const vencimento = calcularVencimentoDoMes(assinatura.diaVencimento, hoje);

      try {
        // mesma regra usada pra mensalidade avulsa: um aluno nunca tem duas
        // mensalidades no mesmo mês, seja ela manual ou recorrente.
        await garantirSemMensalidadeNoMes(assinatura.alunoId, vencimento.toISOString());
      } catch (error) {
        if (error instanceof AppError) {
          ignoradasPorDuplicidade++;
          continue;
        }
        throw error;
      }

      const valorFinal = calcularValorFinal({
        valor: assinatura.valor,
        desconto: assinatura.desconto,
        acrescimo: assinatura.acrescimo,
        multa: assinatura.multa,
        juros: assinatura.juros,
      });

      await prisma.mensalidade.create({
        data: {
          unidadeId: assinatura.unidadeId,
          alunoId: assinatura.alunoId,
          assinaturaId: assinatura.id,
          formaPagamentoId: assinatura.formaPagamentoId,
          valor: assinatura.valor,
          valorOriginal: assinatura.valor,
          desconto: assinatura.desconto,
          acrescimo: assinatura.acrescimo,
          multa: assinatura.multa,
          juros: assinatura.juros,
          valorFinal,
          vencimento,
          descricao: "Mensalidade recorrente",
        },
      });

      const parcelasGeradas = assinatura.parcelasGeradas + 1;
      const atingiuLimite =
        !assinatura.indeterminado && assinatura.numeroParcelas !== null && parcelasGeradas >= assinatura.numeroParcelas;

      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data: {
          parcelasGeradas,
          ultimaCobrancaGeradaEm: hoje,
          status: atingiuLimite ? "CONCLUIDA" : assinatura.status,
        },
      });

      geradas++;
      if (atingiuLimite) concluidas++;
    }

    return { geradas, ignoradasPorDuplicidade, concluidas };
  }
}
