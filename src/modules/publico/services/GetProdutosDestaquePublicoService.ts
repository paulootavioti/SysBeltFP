import { prisma } from "../../../shared/database/prisma";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

export class GetProdutosDestaquePublicoService {
  async execute() {
    const unidadeId = obterUnidadePublicaId();

    const produtos = await prisma.produto.findMany({
      where: { unidadeId, ativo: true },
      select: { id: true, nome: true, categoria: true, preco: true, imagemUrl: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return produtos;
  }
}
