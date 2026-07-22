import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class GetMensalidadeService {

  async execute(id: number) {

    const mensalidade =
      await prisma.mensalidade.findUnique({
        where: { id },
        include: {
          aluno: true
        }
      });

    if (!mensalidade) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    return mensalidade;
  }

}
