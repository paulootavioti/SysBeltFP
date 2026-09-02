import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class AgendarExperimentalLeadService {
  async execute(id: number, unidadeId: number | null, usuarioId: number, data: Date) {
    if (Number.isNaN(data.getTime()) || data <= new Date()) throw new AppError("Informe uma data futura para a aula experimental.");
    const db = prismaDaRequisicao();
    return db.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } });
      if (!lead) throw new AppError("Lead não encontrado.", 404);
      garantirAcessoUnidade(unidadeId, lead.unidadeId, "Lead não encontrado.");
      if (lead.estagio === "MATRICULADO" || lead.estagio === "PERDIDO") throw new AppError("O estágio atual não permite agendamento.");
      const atualizado = await tx.lead.update({ where: { id }, data: { estagio: "EXPERIMENTAL_AGENDADA", proximaAcaoEm: data } });
      await tx.leadEvento.create({ data: { leadId: id, unidadeId: lead.unidadeId, usuarioId, tipo: "EXPERIMENTAL_AGENDADA", descricao: "Aula experimental agendada.", payload: { data: data.toISOString() } } });
      return atualizado;
    });
  }
}
