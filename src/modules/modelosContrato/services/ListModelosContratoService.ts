import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListModelosContratoService {
  async execute(unidadeId: number | null) {
    return prisma.modeloContrato.findMany({
      where: escopoUnidade(unidadeId),
      orderBy: [{ nome: "asc" }, { versao: "desc" }],
    });
  }
}
