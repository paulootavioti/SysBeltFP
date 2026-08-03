import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class ListFotosTreinoService {
  async execute(aulaId: number, solicitante: Solicitante) {
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
      include: { turma: true },
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode ver fotos das suas próprias turmas.", 403);
    }

    return prisma.fotoTreino.findMany({
      where: { aulaId },
      include: { publicadaPor: { select: { id: true, nome: true } } },
      orderBy: { publicadaEm: "desc" },
    });
  }
}
