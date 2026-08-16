import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

interface UpdateUnidadeDTO {
  nome: string;
}

export class UpdateUnidadeService {
  async execute(id: number, data: UpdateUnidadeDTO) {
    const prisma = prismaDaRequisicao();
    const unidade = await prisma.unidade.findUnique({ where: { id } });

    if (!unidade) {
      throw new AppError("Unidade não encontrada.");
    }

    return prisma.unidade.update({ where: { id }, data });
  }
}
