import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface MarcarTecnicaDTO {
  tecnicaId: number;
  executada: boolean;
}

export class MarcarTecnicaProfessorService {
  async execute(aulaId: number, data: MarcarTecnicaDTO, solicitante: Solicitante) {
    const aula = await prisma.aula.findUnique({ where: { id: aulaId }, include: { turma: true } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode registrar técnicas das suas próprias turmas.", 403);
    }

    if (aula.status === "FINALIZADA") {
      throw new AppError("Não é possível alterar uma aula finalizada.");
    }

    return prisma.aula.update({
      where: { id: aulaId },
      data: {
        tecnicasRealizadas: data.executada
          ? { connect: { id: data.tecnicaId } }
          : { disconnect: { id: data.tecnicaId } },
      },
      include: { tecnicasRealizadas: true },
    });
  }
}
