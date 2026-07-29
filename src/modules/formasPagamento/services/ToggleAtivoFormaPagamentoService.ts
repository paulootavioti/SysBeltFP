import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoFormaPagamentoService {
  async execute(id: number, unidadeId: number | null) {
    const formaPagamento = await prisma.formaPagamento.findUnique({ where: { id } });

    if (!formaPagamento) {
      throw new AppError("Forma de pagamento não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, formaPagamento.unidadeId, "Forma de pagamento não encontrada.");

    return prisma.formaPagamento.update({
      where: { id },
      data: { ativo: !formaPagamento.ativo },
    });
  }
}
