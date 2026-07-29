import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { gerarConteudoContrato } from "../utils/gerarConteudoContrato";

export interface ResultadoRenovacaoAutomatica {
  renovados: number;
}

// Motor de renovação automática — pra cada Contrato ATIVO com
// renovacaoAutomatica=true cuja vigência já terminou, gera o contrato
// seguinte (RASCUNHO, encadeado via contratoAnteriorId) e marca o atual
// como RENOVADO. Chamado pelo disparo externo (cron, sem unidadeId — roda
// pra todo mundo), no mesmo padrão de
// GerarCobrancasRecorrentesService — não há usuário autenticado aqui,
// então (assim como lá) não grava AuditLog.
export class RenovarContratosVencidosService {
  async execute(unidadeId: number | null): Promise<ResultadoRenovacaoAutomatica> {
    const hoje = new Date();

    const contratos = await prisma.contrato.findMany({
      where: {
        situacao: "ATIVO",
        renovacaoAutomatica: true,
        dataFimVigencia: { not: null, lte: hoje },
        ...escopoUnidade(unidadeId),
      },
    });

    let renovados = 0;

    for (const contratoAtual of contratos) {
      const { conteudoGerado, contratanteResponsavelId } = await gerarConteudoContrato({
        unidadeId: contratoAtual.unidadeId,
        alunoId: contratoAtual.alunoId,
        modeloContratoId: contratoAtual.modeloContratoId,
        planoId: contratoAtual.planoId,
        formaPagamentoId: contratoAtual.formaPagamentoId,
        valor: contratoAtual.valor,
        dataFimVigencia: null,
      });

      const ultimoContrato = await prisma.contrato.findFirst({
        where: { unidadeId: contratoAtual.unidadeId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const numero = (ultimoContrato?.numero ?? 0) + 1;

      await prisma.$transaction([
        prisma.contrato.create({
          data: {
            unidadeId: contratoAtual.unidadeId,
            numero,
            alunoId: contratoAtual.alunoId,
            contratanteResponsavelId,
            modeloContratoId: contratoAtual.modeloContratoId,
            planoId: contratoAtual.planoId,
            formaPagamentoId: contratoAtual.formaPagamentoId,
            valor: contratoAtual.valor,
            dataInicioVigencia: contratoAtual.dataFimVigencia as Date,
            dataFimVigencia: null,
            regrasCancelamento: contratoAtual.regrasCancelamento,
            clausulas: contratoAtual.clausulas,
            conteudoGerado,
            renovacaoAutomatica: contratoAtual.renovacaoAutomatica,
            contratoAnteriorId: contratoAtual.id,
          },
        }),
        prisma.contrato.update({
          where: { id: contratoAtual.id },
          data: { situacao: "RENOVADO" },
        }),
      ]);

      renovados++;
    }

    return { renovados };
  }
}
