import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetEventoService {
  async execute(id: number, unidadeIdUsuario: number | null) {
    const prisma = prismaDaRequisicao();
    const evento = await prisma.evento.findUnique({ where: { id } });

    if (!evento) {
      throw new AppError("Evento não encontrado.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, evento.unidadeId, "Evento não encontrado.");

    return evento;
  }
}
