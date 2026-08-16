import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { StartAulaService } from "./StartAulaService";

export class IniciarAulaProgramadaService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const programacao = await prisma.aulaProgramada.findUnique({
      where: { id },
    });

    if (!programacao) {
      throw new AppError("Programação não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, programacao.unidadeId, "Programação não encontrada.");

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Esta programação já foi iniciada ou cancelada.");
    }

    const startAulaService = new StartAulaService();

    const aula = await startAulaService.execute(
      {
        turmaId: programacao.turmaId,
        aulaCurriculoId: programacao.aulaCurriculoId ?? undefined,
        observacoes: programacao.observacoes ?? undefined,
      },
      unidadeId
    );

    await prisma.aulaProgramada.update({
      where: { id },
      data: {
        status: "INICIADA",
        aulaId: aula.id,
      },
    });

    return aula;
  }
}
