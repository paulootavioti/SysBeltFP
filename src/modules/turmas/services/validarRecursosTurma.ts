import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

interface RecursosTurma {
  professorId?: number | null;
  arenaId?: number | null;
  curriculoId?: number | null;
  modalidadeId?: number | null;
  horarioInicio: string;
  horarioFim: string;
}

export async function validarRecursosTurma(unidadeId: number, data: RecursosTurma) {
  if (data.horarioInicio >= data.horarioFim) {
    throw new AppError("O horário de término deve ser posterior ao horário de início.");
  }

  const prisma = prismaDaRequisicao();
  const [professor, arena, curriculo, modalidade] = await Promise.all([
    data.professorId ? prisma.usuario.findFirst({
      where: {
        id: data.professorId,
        ativo: true,
        perfil: "PROFESSOR",
        OR: [
          { unidadeId },
          { unidadesVinculadas: { some: { unidadeId } } },
        ],
      },
      select: { id: true },
    }) : null,
    data.arenaId ? prisma.arena.findFirst({
      where: { id: data.arenaId, unidadeId, ativo: true },
      select: { id: true },
    }) : null,
    data.curriculoId ? prisma.curriculo.findFirst({
      where: { id: data.curriculoId, unidadeId, ativo: true },
      select: { id: true },
    }) : null,
    data.modalidadeId ? prisma.modalidade.findFirst({
      where: { id: data.modalidadeId, unidadeId, ativo: true },
      select: { id: true },
    }) : null,
  ]);

  if (data.professorId && !professor) throw new AppError("Professor ativo não encontrado nesta unidade.");
  if (data.arenaId && !arena) throw new AppError("Arena ativa não encontrada nesta unidade.");
  if (data.curriculoId && !curriculo) throw new AppError("Currículo ativo não encontrado nesta unidade.");
  if (data.modalidadeId && !modalidade) throw new AppError("Modalidade ativa não encontrada nesta unidade.");
}
