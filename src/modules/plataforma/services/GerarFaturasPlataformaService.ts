import { Prisma } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { competenciaDoMes, vencimentoDaCompetencia } from "../utils/competencia";
import { calcularPrecoPorFaixa } from "../utils/precoPlataforma";
import { ContarAlunosDaContaService } from "./ContarAlunosDaContaService";

export interface ResultadoFechamento {
  geradas: number;
  jaExistiam: number;
  valorTotalCentavos: number;
}

// Só quem está pagando entra no fechamento. TESTE fica de fora (período
// gratuito), SUSPENSA e CANCELADA também — cobrar quem foi cortado só
// gera fatura pra estornar depois. INADIMPLENTE continua faturando: o
// atraso de um mês não perdoa o mês seguinte.
const STATUS_FATURAVEIS: Prisma.EnumStatusAssinaturaPlataformaFilter = {
  in: ["ATIVA", "INADIMPLENTE"],
};

/**
 * Fechamento mensal da plataforma: para cada assinatura faturável, conta os
 * alunos ativos da conta, aplica a faixa de preço e emite a fatura do mês.
 *
 * Idempotente por construção. A fatura tem índice único em
 * (assinaturaId, competencia), então a segunda chamada no mesmo mês bate na
 * trava do banco em vez de duplicar a cobrança — inclusive se duas rodadas
 * do cron caírem ao mesmo tempo, caso em que um `findFirst` antes do
 * `create` deixaria uma janela de corrida aberta.
 */
export class GerarFaturasPlataformaService {
  /**
   * @param contaId quando informado, fecha só essa conta — serve pra
   * reemitir a fatura de um cliente sem mexer nas dos outros.
   */
  async execute(referencia: Date = new Date(), contaId?: number): Promise<ResultadoFechamento> {
    const competencia = competenciaDoMes(referencia);
    const contarAlunos = new ContarAlunosDaContaService();

    const assinaturas = await prisma.assinaturaPlataforma.findMany({
      where: {
        status: STATUS_FATURAVEIS,
        conta: { ativo: true },
        ...(contaId === undefined ? {} : { contaId }),
      },
      include: { plano: true },
    });

    let geradas = 0;
    let jaExistiam = 0;
    let valorTotalCentavos = 0;

    for (const assinatura of assinaturas) {
      const alunosContados = await contarAlunos.execute(assinatura.contaId);

      const preco = calcularPrecoPorFaixa(alunosContados, {
        alunosPorBloco: assinatura.plano.alunosPorBloco,
        // preço negociado na assinatura vence o preço de tabela do plano.
        precoPorBlocoCentavos:
          assinatura.precoPorBlocoCentavos ?? assinatura.plano.precoPorBlocoCentavos,
        blocosMinimos: assinatura.plano.blocosMinimos,
      });

      try {
        await prisma.faturaPlataforma.create({
          data: {
            contaId: assinatura.contaId,
            assinaturaId: assinatura.id,
            competencia,
            vencimento: vencimentoDaCompetencia(competencia, assinatura.diaVencimento),
            // os parâmetros vão gravados junto com o resultado: se o plano
            // mudar de preço mês que vem, a fatura de hoje continua
            // explicando por que cobrou o que cobrou.
            alunosContados: preco.alunosContados,
            alunosPorBloco: preco.alunosPorBloco,
            blocos: preco.blocos,
            precoPorBlocoCentavos: preco.precoPorBlocoCentavos,
            valorCentavos: preco.valorCentavos,
          },
        });

        geradas++;
        valorTotalCentavos += preco.valorCentavos;
      } catch (erro) {
        if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
          jaExistiam++;
          continue;
        }

        throw erro;
      }
    }

    return { geradas, jaExistiam, valorTotalCentavos };
  }
}
