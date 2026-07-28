import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteMetaService {
  async execute(id: number, unidadeIdUsuario: number | null) {
    const meta = await prisma.meta.findUnique({ where: { id } });

    if (!meta) {
      throw new AppError("Meta não encontrada.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, meta.unidadeId, "Meta não encontrada.");

    await prisma.meta.delete({ where: { id } });
  }
}
