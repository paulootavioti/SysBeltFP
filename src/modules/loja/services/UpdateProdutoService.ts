import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { CategoriaProduto } from "@prisma/client";

interface VarianteDTO {
  id?: number;
  tamanho: string;
  cor?: string;
  estoque: number;
}

interface UpdateProdutoDTO {
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao?: string;
  imagemUrl?: string;
  variantes: VarianteDTO[];
}

export class UpdateProdutoService {
  async execute(id: number, data: UpdateProdutoDTO, unidadeId: number | null) {
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { variantes: true },
    });

    if (!produto) {
      throw new AppError("Produto não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, produto.unidadeId, "Produto não encontrado.");

    const { variantes, ...produtoData } = data;

    const idsMantidos = variantes.filter((v) => v.id).map((v) => v.id as number);
    const idsParaRemover = produto.variantes
      .map((v) => v.id)
      .filter((varianteId) => !idsMantidos.includes(varianteId));

    return prisma.$transaction(async (tx) => {
      if (idsParaRemover.length > 0) {
        await tx.produtoVariante.deleteMany({ where: { id: { in: idsParaRemover } } });
      }

      for (const variante of variantes) {
        if (variante.id) {
          await tx.produtoVariante.update({
            where: { id: variante.id },
            data: { tamanho: variante.tamanho, cor: variante.cor, estoque: variante.estoque },
          });
        } else {
          await tx.produtoVariante.create({
            data: {
              produtoId: id,
              tamanho: variante.tamanho,
              cor: variante.cor,
              estoque: variante.estoque,
            },
          });
        }
      }

      return tx.produto.update({
        where: { id },
        data: produtoData,
        include: { variantes: true },
      });
    });
  }
}
