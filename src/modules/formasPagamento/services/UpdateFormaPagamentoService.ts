import type { Prisma, TipoFormaPagamento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateFormaPagamentoDTO {
  tipo: TipoFormaPagamento;
  nomePersonalizado?: string | null;
  configuracao?: Record<string, unknown> | null;
}

export class UpdateFormaPagamentoService {
  async execute(id: number, data: UpdateFormaPagamentoDTO, unidadeId: number | null) {
    const formaPagamento = await prisma.formaPagamento.findUnique({ where: { id } });

    if (!formaPagamento) {
      throw new AppError("Forma de pagamento não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, formaPagamento.unidadeId, "Forma de pagamento não encontrada.");

    return prisma.formaPagamento.update({
      where: { id },
      data: {
        tipo: data.tipo,
        nomePersonalizado: data.nomePersonalizado?.trim() || null,
        configuracao: (data.configuracao as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }
}
