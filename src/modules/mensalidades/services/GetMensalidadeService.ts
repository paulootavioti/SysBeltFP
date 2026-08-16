import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetMensalidadeService {

  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    const mensalidade =
      await prisma.mensalidade.findUnique({
        where: { id },
        include: {
          aluno: true,
          formaPagamento: true,
        }
      });

    if (!mensalidade) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidade.unidadeId, "Mensalidade não encontrada.");

    return mensalidade;
  }

}
