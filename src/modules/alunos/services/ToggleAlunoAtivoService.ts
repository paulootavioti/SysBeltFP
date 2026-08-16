import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAlunoAtivoService {

  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    const aluno =
      await prisma.aluno.findUnique({
        where: { id }
      });

    if (!aluno) {
      throw new AppError(
        "Aluno não encontrado."
      );
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    return prisma.aluno.update({
      where: { id },
      data: {
        ativo: !aluno.ativo
      }
    });

  }

}
