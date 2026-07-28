import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetAlunoCompletoService {
  async execute(id: number, unidadeId: number | null, perfil?: string) {
    // PROFESSOR só pode ver: nome, apelido, nome do responsável, turma,
    // presenças e graduações — nada de CPF, endereço, saúde ou financeiro.
    if (perfil === "PROFESSOR") {
      const alunoBasico = await prisma.aluno.findUnique({
        where: { id },
        select: {
          id: true,
          unidadeId: true,
          nome: true,
          apelido: true,
          turma: { select: { id: true, nome: true } },
          responsaveis: { select: { id: true, nome: true } },
          graduacoes: { orderBy: { data: "desc" } },
          aulas: {
            select: { id: true, presente: true, aula: { select: { data: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!alunoBasico) {
        throw new AppError("Aluno não encontrado.");
      }

      garantirAcessoUnidade(unidadeId, alunoBasico.unidadeId, "Aluno não encontrado.");

      const { unidadeId: _unidadeId, aulas, ...resto } = alunoBasico;

      return {
        ...resto,
        presencas: aulas
          .filter((registro) => registro.presente)
          .map((registro) => ({ id: registro.id, data: registro.aula.data })),
      };
    }

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

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

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