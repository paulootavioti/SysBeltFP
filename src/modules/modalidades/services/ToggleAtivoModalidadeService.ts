import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoModalidadeService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modalidade = await prisma.modalidade.findUnique({
      where: { id },
      include: { _count: { select: { turmas: true } } },
    });

    if (!modalidade) {
      throw new AppError("Modalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, modalidade.unidadeId, "Modalidade não encontrada.");

    // Inativar é o "excluir" possível aqui: turmas e currículos continuam
    // apontando pra ela, então some das opções novas sem apagar histórico.
    // Mas se ainda há turma ativa rodando, isso é quase certamente engano.
    if (modalidade.ativo) {
      const turmasAtivas = await prisma.turma.count({
        where: { modalidadeId: id, ativo: true },
      });

      if (turmasAtivas > 0) {
        throw new AppError(
          `Esta modalidade ainda tem ${turmasAtivas} turma(s) ativa(s). Encerre ou mova essas turmas antes de inativá-la.`
        );
      }
    }

    return prisma.modalidade.update({
      where: { id },
      data: { ativo: !modalidade.ativo },
      include: {
        unidade: { select: { id: true, nome: true } },
        coordenador: { select: { id: true, nome: true } },
      },
    });
  }
}
