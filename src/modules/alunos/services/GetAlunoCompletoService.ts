import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class GetAlunoCompletoService {
  async execute(id: number) {
    const aluno = await prisma.aluno.findUnique({
      where: {
        id
      },
      include: {
        responsaveis: true,
        aulas: {
          include: {
            aula: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        graduacoes: {
          orderBy: {
            data: "desc"
          }
        },
        mensalidades: {
          orderBy: {
            vencimento: "desc"
          }
        },
        turma: true,
        plano: true,
        comportamentos: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    const presencas = aluno.aulas
      .filter((registro) => registro.presente)
      .map((registro) => ({
        id: registro.id,
        data: registro.aula.data,
      }));

    return {
      ...aluno,
      presencas,
    };
  }
}