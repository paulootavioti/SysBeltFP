import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { calcularFrequenciaPorPeriodo } from "../../../shared/utils/calcularFrequencia";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

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
          unidadesPermitidas: { select: { unidadeId: true } },
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

      if (unidadeId !== null && !alunoBasico.unidadesPermitidas.some((vinculo) => vinculo.unidadeId === unidadeId)) {
        throw new AppError("Aluno não encontrado.");
      }

      const { unidadeId: _unidadeId, unidadesPermitidas: _unidadesPermitidas, aulas, ...resto } = alunoBasico;

      return {
        ...resto,
        presencas: aulas
          .filter((registro) => registro.presente)
          .map((registro) => ({ id: registro.id, data: registro.aula.data })),
        ...calcularFrequenciaPorPeriodo(
          aulas.map((registro) => ({ presente: registro.presente, data: registro.aula.data }))
        ),
      };
    }

    const aluno = await prisma.aluno.findUnique({
      where: {
        id
      },
      include: {
        responsaveis: true,
        unidadesPermitidas: { select: { unidadeId: true } },
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

    if (unidadeId !== null && !aluno.unidadesPermitidas.some((vinculo) => vinculo.unidadeId === unidadeId)) {
      throw new AppError("Aluno não encontrado.");
    }

    const presencas = aluno.aulas
      .filter((registro) => registro.presente)
      .map((registro) => ({
        id: registro.id,
        data: registro.aula.data,
      }));

    // Prontuário completo inclui saúde, documento e financeiro. O
    // requisito de auditoria pede registrar o que foi VISUALIZADO, não só
    // o que mudou — é isso que permite investigar acesso indevido depois.
    await auditLogService.registrar({
      unidadeId: aluno.unidadeId,
      entidade: "Aluno",
      entidadeId: aluno.id,
      operacao: "CONSULTA_SENSIVEL",
      valoresDepois: { motivo: "Prontuário completo do aluno" },
    });

    const { unidadesPermitidas, ...dadosAluno } = aluno;
    return {
      ...dadosAluno,
      unidadesPermitidasIds: unidadesPermitidas.map((vinculo) => vinculo.unidadeId),
      presencas,
      ...calcularFrequenciaPorPeriodo(
        aluno.aulas.map((registro) => ({ presente: registro.presente, data: registro.aula.data }))
      ),
    };
  }
}
