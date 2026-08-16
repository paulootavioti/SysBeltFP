import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListResponsaveisByAlunoService {
  async execute(alunoId: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    return prisma.responsavel.findMany({
      where: {
        alunoId,
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}
