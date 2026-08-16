import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

interface UpdateUnidadeDTO {
  nome: string;
}

export class UpdateUnidadeService {
  async execute(id: number, contaId: number, data: UpdateUnidadeDTO) {
    const prisma = prismaDaRequisicao();
    const unidade = await prisma.unidade.findFirst({ where: { id, contaId } });

    if (!unidade) {
      throw new AppError("Unidade não encontrada.");
    }

    return prisma.unidade.update({ where: { id }, data: { nome: data.nome.trim() } });
  }
}
