import { prisma } from "../../../shared/database/prisma";

export class DeleteAulaService {
  async execute(id: number) {
    await prisma.$transaction([
      prisma.aulaProgramada.updateMany({
        where: { aulaId: id },
        data: { aulaId: null, status: "PENDENTE" },
      }),
      prisma.aulaAluno.deleteMany({ where: { aulaId: id } }),
      prisma.aula.delete({ where: { id } }),
    ]);
  }
}
