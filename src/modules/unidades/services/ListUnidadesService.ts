import { prisma } from "../../../shared/database/prisma";

export class ListUnidadesService {
  async execute() {
    return prisma.unidade.findMany({
      orderBy: { nome: "asc" },
    });
  }
}
