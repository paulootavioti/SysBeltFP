import { prisma } from "../../../shared/database/prisma";

export class ListTurmasService {
  async execute() {
    return prisma.turma.findMany({
      include: {
        curriculo: true,
        _count: {
          select: {
            alunos: {
              where: { ativo: true },
            },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}