import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
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

    return {
      ...aluno,
      presencas,
      ...calcularFrequenciaPorPeriodo(
        aluno.aulas.map((registro) => ({ presente: registro.presente, data: registro.aula.data }))
      ),
    };
  }
}