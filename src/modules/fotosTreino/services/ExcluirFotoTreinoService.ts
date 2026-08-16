import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class ExcluirFotoTreinoService {
  async execute(id: number, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const foto = await prisma.fotoTreino.findUnique({
      where: { id },
      include: { aula: { select: { unidadeId: true } } },
    });

    if (!foto) {
      throw new AppError("Foto não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, foto.aula.unidadeId, "Foto não encontrada.");

    if (solicitante.perfil !== "ADMIN" && foto.publicadaPorId !== solicitante.id) {
      throw new AppError("Só quem publicou a foto (ou um ADMIN) pode excluí-la.", 403);
    }

    await prisma.fotoTreino.delete({ where: { id } });
  }
}
