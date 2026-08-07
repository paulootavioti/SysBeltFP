import type { TipoConsentimento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { VERSAO_POLITICA_MIGRADA } from "../constants";

export interface SituacaoConsentimento {
  tipo: TipoConsentimento;
  concedido: boolean;
  // true quando o registro veio do backfill: a resposta existe, mas não
  // há evidência de coleta nos termos da LGPD.
  precisaRecoletar: boolean;
  registradoEm: Date | null;
  versaoPolitica: string | null;
}

// Fonte da verdade do consentimento atual: a linha mais recente daquele
// tipo que não foi revogada. O histórico inteiro fica preservado — nunca
// se apaga um consentimento, revoga-se.
export class ConsultarConsentimentoService {
  async situacaoAtual(alunoId: number, tipo: TipoConsentimento): Promise<SituacaoConsentimento> {
    const ultimo = await prisma.consentimento.findFirst({
      where: { alunoId, tipo, revogadoEm: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    if (!ultimo) {
      return {
        tipo,
        concedido: false,
        precisaRecoletar: false,
        registradoEm: null,
        versaoPolitica: null,
      };
    }

    return {
      tipo,
      concedido: ultimo.concedido,
      precisaRecoletar: ultimo.versaoPolitica === VERSAO_POLITICA_MIGRADA,
      registradoEm: ultimo.createdAt,
      versaoPolitica: ultimo.versaoPolitica,
    };
  }

  /** Vale como autorização de verdade — migrado não conta. */
  async temConsentimentoValido(alunoId: number, tipo: TipoConsentimento): Promise<boolean> {
    const situacao = await this.situacaoAtual(alunoId, tipo);

    return situacao.concedido && !situacao.precisaRecoletar;
  }

  async historico(alunoId: number) {
    return prisma.consentimento.findMany({
      where: { alunoId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        responsavel: { select: { id: true, nome: true, parentesco: true } },
        registradoPor: { select: { id: true, nome: true } },
        revogadoPor: { select: { id: true, nome: true } },
      },
    });
  }
}
