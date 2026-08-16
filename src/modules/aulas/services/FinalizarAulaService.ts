import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class FinalizarAulaService {
  async execute(id: number, solicitante: Solicitante, observacoes?: string) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({
      where: { id },
      include: { turma: true },
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode finalizar a chamada das suas próprias turmas.", 403);
    }

    if (aula.status === "FINALIZADA") {
      throw new AppError("Esta aula já foi finalizada.");
    }

    return prisma.aula.update({
      where: { id },
      data: {
        status: "FINALIZADA",
        observacoes: observacoes?.trim() || aula.observacoes,
      },
    });
  }
}
