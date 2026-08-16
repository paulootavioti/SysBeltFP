import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListModelosContratoService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.modeloContrato.findMany({
      where: escopoUnidade(unidadeId),
      orderBy: [{ nome: "asc" }, { versao: "desc" }],
    });
  }
}
