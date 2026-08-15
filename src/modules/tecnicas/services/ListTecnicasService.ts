import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListTecnicasService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.tecnica.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        ativa: true,
        ...escopoUnidade(unidadeId),
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}
