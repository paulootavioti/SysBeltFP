import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { horariosSobrepoem } from "../../../shared/utils/conflitoHorario";

interface TransferirAulaProgramadaDTO {
  professorSubstitutoId: number;
  motivo: string;
}

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class TransferirAulaProgramadaService {
  async execute(id: number, dto: TransferirAulaProgramadaDTO, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const programacao = await prisma.aulaProgramada.findUnique({
      where: { id },
      include: { turma: true },
    });

    if (!programacao) {
      throw new AppError("Programação não encontrada.", 404);
    }

    garantirAcessoUnidade(solicitante.unidadeId, programacao.unidadeId, "Programação não encontrada.");

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Só é possível transferir uma programação pendente.");
    }

    // o professor titular só transfere as próprias turmas — ADMIN transfere
    // qualquer aula da unidade.
    if (solicitante.perfil === "PROFESSOR" && programacao.turma.professorId !== solicitante.id) {
      throw new AppError("Você só pode transferir aulas das suas próprias turmas.", 403);
    }

    if (dto.professorSubstitutoId === programacao.turma.professorId) {
      throw new AppError("O professor substituto precisa ser diferente do professor titular da turma.");
    }

    const substituto = await prisma.usuario.findUnique({ where: { id: dto.professorSubstitutoId } });

    if (
      !substituto ||
      substituto.perfil !== "PROFESSOR" ||
      !substituto.ativo ||
      substituto.unidadeId !== programacao.unidadeId
    ) {
      throw new AppError("Professor substituto inválido.");
    }

    const candidatasMesmoDia = await prisma.aulaProgramada.findMany({
      where: {
        id: { not: id },
        data: programacao.data,
        status: { not: "CANCELADA" },
      },
      include: {
        turma: { select: { nome: true, professorId: true, horarioInicio: true, horarioFim: true } },
      },
    });

    const conflito = candidatasMesmoDia.find((candidata) => {
      const professorEfetivo = candidata.professorSubstitutoId ?? candidata.turma.professorId;

      if (professorEfetivo !== dto.professorSubstitutoId) return false;

      return horariosSobrepoem(
        programacao.turma.horarioInicio,
        programacao.turma.horarioFim,
        candidata.turma.horarioInicio,
        candidata.turma.horarioFim
      );
    });

    if (conflito) {
      throw new AppError(
        `Conflito de horário: o professor substituto já está escalado para a turma "${conflito.turma.nome}" nesse mesmo horário.`
      );
    }

    return prisma.aulaProgramada.update({
      where: { id },
      data: {
        professorSubstitutoId: dto.professorSubstitutoId,
        motivoTransferencia: dto.motivo,
      },
      include: {
        turma: { include: { professor: true, arena: true } },
        professorSubstituto: { select: { id: true, nome: true, apelido: true } },
      },
    });
  }
}
