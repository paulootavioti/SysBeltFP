import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

const REMETENTE_OPOSTO: Record<"FAMILIA" | "ACADEMIA", "FAMILIA" | "ACADEMIA"> = {
  FAMILIA: "ACADEMIA",
  ACADEMIA: "FAMILIA",
};

// `unidadeIdSolicitante` só é checado quando informado — a sessão do
// Portal da Família (não tem unidade própria) já restringe por
// garantirAlunoNoEscopo antes de chegar aqui, então passa null; o lado
// staff (ADMIN/RECEPCAO) sempre passa a própria unidade.
//
// `visualizadoPor` marca como lidas as mensagens do OUTRO lado da
// conversa — abrir a tela como ACADEMIA lê o que a FAMILIA mandou, e
// vice-versa. É assim que os badges de "não lida" somem: simplesmente
// abrindo a conversa, sem ação extra.
export class ListMensagensFamiliaService {
  async execute(
    alunoId: number,
    unidadeIdSolicitante: number | null = null,
    visualizadoPor?: "FAMILIA" | "ACADEMIA"
  ) {
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeIdSolicitante, aluno.unidadeId, "Aluno não encontrado.");

    if (visualizadoPor) {
      await prisma.mensagemFamilia.updateMany({
        where: { alunoId, remetenteTipo: REMETENTE_OPOSTO[visualizadoPor], lida: false },
        data: { lida: true },
      });
    }

    return prisma.mensagemFamilia.findMany({
      where: { alunoId },
      orderBy: { createdAt: "asc" },
    });
  }
}
