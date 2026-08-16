import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class ListUnidadesService {
  async execute(contaId: number) {
    const prisma = prismaDaRequisicao();
    return prisma.unidade.findMany({
      where: { contaId },
      orderBy: { nome: "asc" },
    });
  }
}
