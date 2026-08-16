import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class ListUnidadesService {
  async execute() {
    const prisma = prismaDaRequisicao();
    return prisma.unidade.findMany({
      orderBy: { nome: "asc" },
    });
  }
}
