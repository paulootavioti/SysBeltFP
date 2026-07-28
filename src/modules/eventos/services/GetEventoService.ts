import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetEventoService {
  async execute(id: number, unidadeIdUsuario: number | null) {
    const evento = await prisma.evento.findUnique({ where: { id } });

    if (!evento) {
      throw new AppError("Evento não encontrado.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, evento.unidadeId, "Evento não encontrado.");

    return evento;
  }
}
