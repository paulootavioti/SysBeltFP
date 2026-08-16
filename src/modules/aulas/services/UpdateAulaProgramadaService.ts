import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { parsearDataAcademia } from "../../../shared/utils/dataCalendario";

interface UpdateAulaProgramadaDTO {
  data?: string | null;
  aulaCurriculoId?: number | null;
  observacoes?: string | null;
}

export class UpdateAulaProgramadaService {
  async execute(id: number, dto: UpdateAulaProgramadaDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const programacao = await prisma.aulaProgramada.findUnique({ where: { id } });

    if (!programacao) {
      throw new AppError("Programação não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, programacao.unidadeId, "Programação não encontrada.");

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Só é possível editar uma programação pendente.");
    }

    return prisma.aulaProgramada.update({
      where: { id },
      data: {
        data: dto.data ? parsearDataAcademia(dto.data) : undefined,
        aulaCurriculoId: dto.aulaCurriculoId,
        observacoes: dto.observacoes,
      },
      include: { turma: true, aulaCurriculo: true },
    });
  }
}
