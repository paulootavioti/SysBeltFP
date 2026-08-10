import type { Prisma, TipoFormaPagamento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { prepararConfiguracaoParaGravar } from "../../pagamentos/gateways";

interface CreateFormaPagamentoDTO {
  unidadeId: number;
  tipo: TipoFormaPagamento;
  nomePersonalizado?: string | null;
  configuracao?: Record<string, unknown> | null;
}

export class CreateFormaPagamentoService {
  async execute(data: CreateFormaPagamentoDTO) {
    // Credencial de gateway entra cifrada. Passa por aqui e não pelo
    // controller pra que nenhum caminho de escrita consiga gravar token
    // em texto puro por esquecimento.
    const configuracao = prepararConfiguracaoParaGravar(data.configuracao, null);

    return prisma.formaPagamento.create({
      data: {
        unidadeId: data.unidadeId,
        tipo: data.tipo,
        nomePersonalizado: data.nomePersonalizado?.trim() || null,
        configuracao: configuracao as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
