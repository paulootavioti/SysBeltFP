import { Prisma } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { competenciaDoMes, vencimentoDaCompetencia } from "../utils/competencia";
import { calcularPrecoPorUnidade } from "../utils/precoPlataforma";
import { ContarAlunosPorUnidadeDaContaService } from "./ContarAlunosPorUnidadeDaContaService";

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
 * alunos ativos de cada unidade, aplica a faixa de preço por licença e emite
 * a fatura do mês.
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
    const prisma = prismaDaRequisicao();
    const competencia = competenciaDoMes(referencia);
    const contarAlunos = new ContarAlunosPorUnidadeDaContaService();

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
      const alunosPorUnidade = await contarAlunos.execute(assinatura.contaId);

      const preco = calcularPrecoPorUnidade(alunosPorUnidade, {
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
            alunosContados: preco.totalLotacoes,
            alunosPorBloco: assinatura.plano.alunosPorBloco,
            blocos: preco.totalBlocos,
            precoPorBlocoCentavos:
              assinatura.precoPorBlocoCentavos ?? assinatura.plano.precoPorBlocoCentavos,
            valorCentavos: preco.valorCentavos,
            detalhamentoUnidades: preco.unidades as unknown as Prisma.InputJsonValue,
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
