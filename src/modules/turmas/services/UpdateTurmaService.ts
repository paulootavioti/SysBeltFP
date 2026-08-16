import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { buscarConflitoTurma, mensagemConflitoTurma } from "../../../shared/utils/conflitoHorario";

interface UpdateTurmaDTO {
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId?: number;
  arenaId?: number;
  limiteAlunos?: number;
  curriculoId?: number;
  modalidadeId?: number | null;
}

export class UpdateTurmaService {
  async execute(id: number, data: UpdateTurmaDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const turmaExistente = await prisma.turma.findUnique({ where: { id } });

    if (!turmaExistente) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turmaExistente.unidadeId, "Turma não encontrada.");

    const conflito = await buscarConflitoTurma({
      unidadeId: turmaExistente.unidadeId,
      diasSemana: data.diasSemana,
      horarioInicio: data.horarioInicio,
      horarioFim: data.horarioFim,
      arenaId: data.arenaId,
      professorId: data.professorId,
      excluirTurmaId: id,
    });

    if (conflito) {
      throw new AppError(mensagemConflitoTurma(conflito));
    }

    return prisma.turma.update({
      where: { id },
      data,
      include: {
        professor: {
          select: { id: true, nome: true, apelido: true },
        },
        arena: true,
        modalidade: true,
        curriculo: true,
      },
    });
  }
}
