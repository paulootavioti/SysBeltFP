import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

export class ToggleAtivoUnidadeService {
  async execute(id: number, contaId: number) {
    const prisma = prismaDaRequisicao();
    const unidade = await prisma.unidade.findFirst({ where: { id, contaId } });

    if (!unidade) {
      throw new AppError("Unidade não encontrada.");
    }

    if (unidade.ativo) {
      const [outrasAtivas, usuariosFixos] = await Promise.all([
        prisma.unidade.count({ where: { contaId, ativo: true, id: { not: id } } }),
        prisma.usuario.count({ where: { unidadeId: id, ativo: true } }),
      ]);

      if (outrasAtivas === 0) {
        throw new AppError("A academia precisa manter pelo menos uma unidade ativa.");
      }

      if (usuariosFixos > 0) {
        throw new AppError("Transfira os usuários desta unidade antes de inativá-la.");
      }
    }

    return prisma.unidade.update({
      where: { id },
      data: { ativo: !unidade.ativo },
    });
  }
}
