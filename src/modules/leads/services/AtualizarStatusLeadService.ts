import { EstagioLead } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class AtualizarStatusLeadService {
  async execute(id: number, estagio: EstagioLead, unidadeId: number | null, usuarioId?: number, motivoPerda?: string) {
    const prisma = prismaDaRequisicao();
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw new AppError("Lead não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, lead.unidadeId, "Lead não encontrado.");

    const permitidos: Record<EstagioLead, EstagioLead[]> = {
      NOVO: ["CONTATADO", "QUALIFICADO", "PERDIDO"], CONTATADO: ["QUALIFICADO", "EXPERIMENTAL_AGENDADA", "PERDIDO"],
      QUALIFICADO: ["EXPERIMENTAL_AGENDADA", "NEGOCIACAO", "PERDIDO"], EXPERIMENTAL_AGENDADA: ["COMPARECEU", "NEGOCIACAO", "PERDIDO"],
      COMPARECEU: ["NEGOCIACAO", "PERDIDO"], NEGOCIACAO: ["PERDIDO"], MATRICULADO: [], PERDIDO: ["NOVO"],
    };
    if (!permitidos[lead.estagio].includes(estagio)) throw new AppError("Transição de estágio não permitida.");
    if (estagio === "PERDIDO" && !motivoPerda?.trim()) throw new AppError("Informe o motivo da perda.");
    return prisma.$transaction(async (tx) => {
      const atualizado = await tx.lead.update({ where: { id }, data: { estagio, motivoPerda: estagio === "PERDIDO" ? motivoPerda!.trim() : null } });
      await tx.leadEvento.create({ data: {
        leadId: id, unidadeId: lead.unidadeId, usuarioId, tipo: "ESTAGIO_ALTERADO",
        descricao: `Estágio alterado de ${lead.estagio} para ${estagio}.`, payload: { anterior: lead.estagio, atual: estagio },
      } });
      return atualizado;
    });
  }
}
