import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

// `unidadeIdSolicitante` só é checado quando informado — a sessão do
// Portal da Família (não tem unidade própria) já restringe por
// garantirAlunoNoEscopo antes de chegar aqui, então passa null; o lado
// staff (ADMIN/RECEPCAO) sempre passa a própria unidade.
export class ListMensagensFamiliaService {
  async execute(alunoId: number, unidadeIdSolicitante: number | null = null) {
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeIdSolicitante, aluno.unidadeId, "Aluno não encontrado.");

    return prisma.mensagemFamilia.findMany({
      where: { alunoId },
      orderBy: { createdAt: "asc" },
    });
  }
}
