import { prisma } from "../../../shared/database/prisma";

// Vitrine consumida pela família: a loja é única pro sistema todo, então
// mostra produtos ativos de qualquer unidade (a família escolhe de qual
// unidade quer comprar — cada produto carrega sua unidade de origem, que é
// onde o pedido precisa ser retirado). Sem paginação — catálogo de loja
// física costuma ser pequeno o suficiente pra não precisar (mesmo teto
// informal que o resto do módulo loja).
export class GetLojaFamiliaService {
  async execute() {
    return prisma.produto.findMany({
      where: { ativo: true },
      include: { variantes: true, unidade: { select: { id: true, nome: true } } },
      orderBy: { nome: "asc" },
    });
  }
}
