import { prisma } from "../../../shared/database/prisma";

export class DeleteCompeticaoService {
  async execute(id: number) {
    await prisma.$transaction([
      prisma.competicaoAluno.deleteMany({ where: { competicaoId: id } }),
      prisma.competicao.delete({ where: { id } }),
    ]);
  }
}
