import { StatusLead } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class AtualizarStatusLeadService {
  async execute(id: number, status: StatusLead, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw new AppError("Lead não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, lead.unidadeId, "Lead não encontrado.");

    return prisma.lead.update({ where: { id }, data: { status } });
  }
}
