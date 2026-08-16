import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetLojaKpisService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const produtos = await prisma.produto.findMany({
      where: { ...escopoUnidade(unidadeId), ativo: true },
      include: { variantes: true },
    });

    let unidadesEmEstoque = 0;
    let valorTotalEstoque = 0;
    let produtosComEstoqueBaixo = 0;

    for (const produto of produtos) {
      const estoqueTotal = produto.variantes.reduce((soma, v) => soma + v.estoque, 0);

      unidadesEmEstoque += estoqueTotal;
      valorTotalEstoque += estoqueTotal * produto.preco;

      const estoqueBaixo = estoqueTotal === 0 || produto.variantes.some((v) => v.estoque <= 3);
      if (estoqueBaixo) produtosComEstoqueBaixo += 1;
    }

    return {
      produtosAtivos: produtos.length,
      unidadesEmEstoque,
      produtosComEstoqueBaixo,
      valorTotalEstoque,
    };
  }
}
