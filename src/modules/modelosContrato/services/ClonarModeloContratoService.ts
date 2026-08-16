import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

// Clonagem gera um modelo novo e independente (sem ligação de
// versionamento com o original) — útil pra usar um modelo existente como
// ponto de partida pra um modelo diferente.
export class ClonarModeloContratoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const original = await prisma.modeloContrato.findUnique({ where: { id } });

    if (!original) {
      throw new AppError("Modelo de contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, original.unidadeId, "Modelo de contrato não encontrado.");

    return prisma.modeloContrato.create({
      data: {
        unidadeId: original.unidadeId,
        nome: `${original.nome} (cópia)`,
        conteudo: original.conteudo,
      },
    });
  }
}
