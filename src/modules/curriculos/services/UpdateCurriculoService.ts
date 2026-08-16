import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateCurriculoDTO {
  nome: string;
  descricao?: string;
  modalidadeId?: number | null;
  publico?: string;
}

export class UpdateCurriculoService {
  async execute(id: number, data: UpdateCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const existente = await prisma.curriculo.findUnique({ where: { id } });

    if (!existente) {
      throw new AppError("Currículo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, existente.unidadeId, "Currículo não encontrado.");

    return prisma.curriculo.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        modalidadeId: data.modalidadeId ?? null,
        publico: data.publico ?? "Kids",
      },
    });
  }
}
