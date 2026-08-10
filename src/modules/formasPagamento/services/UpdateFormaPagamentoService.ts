import type { Prisma, TipoFormaPagamento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { prepararConfiguracaoParaGravar } from "../../pagamentos/gateways";

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

    // A tela nunca recebe a credencial de volta, então também não a
    // reenvia ao salvar. Sem mesclar com o que já está gravado, editar o
    // nome da forma de pagamento apagaria o token do cliente.
    const configuracao = prepararConfiguracaoParaGravar(
      data.configuracao,
      formaPagamento.configuracao
    );

    return prisma.formaPagamento.update({
      where: { id },
      data: {
        tipo: data.tipo,
        nomePersonalizado: data.nomePersonalizado?.trim() || null,
        configuracao: configuracao as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
