import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoProdutoService {
  async execute(id: number, unidadeId: number | null) {
    const produto = await prisma.produto.findUnique({ where: { id } });

    if (!produto) {
      throw new AppError("Produto não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, produto.unidadeId, "Produto não encontrado.");

    return prisma.produto.update({
      where: { id },
      data: { ativo: !produto.ativo },
      include: { variantes: true },
    });
  }
}
