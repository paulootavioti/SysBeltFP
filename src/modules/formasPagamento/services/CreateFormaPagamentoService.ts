import type { Prisma, TipoFormaPagamento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";

interface CreateFormaPagamentoDTO {
  unidadeId: number;
  tipo: TipoFormaPagamento;
  nomePersonalizado?: string | null;
  configuracao?: Record<string, unknown> | null;
}

export class CreateFormaPagamentoService {
  async execute(data: CreateFormaPagamentoDTO) {
    return prisma.formaPagamento.create({
      data: {
        unidadeId: data.unidadeId,
        tipo: data.tipo,
        nomePersonalizado: data.nomePersonalizado?.trim() || null,
        configuracao: (data.configuracao as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }
}
