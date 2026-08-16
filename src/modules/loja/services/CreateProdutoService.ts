import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { CategoriaProduto } from "@prisma/client";

interface VarianteDTO {
  tamanho: string;
  cor?: string;
  estoque: number;
}

interface CreateProdutoDTO {
  unidadeId: number;
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao?: string;
  imagemUrl?: string;
  variantes: VarianteDTO[];
}

export class CreateProdutoService {
  async execute(data: CreateProdutoDTO) {
    const prisma = prismaDaRequisicao();
    const { variantes, ...produtoData } = data;

    return prisma.produto.create({
      data: {
        ...produtoData,
        variantes: {
          create: variantes.map((variante) => ({
            tamanho: variante.tamanho,
            cor: variante.cor,
            estoque: variante.estoque,
          })),
        },
      },
      include: { variantes: true },
    });
  }
}
