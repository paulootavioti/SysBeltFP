import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

type StatusManual = "ATIVA" | "PAUSADA" | "CANCELADA";

// CONCLUIDA é um status só o motor de geração atribui (numeroParcelas
// esgotado ou dataFim vencida) — não é uma opção manual do usuário.
export class AlterarStatusAssinaturaService {
  async execute(id: number, unidadeId: number | null, status: StatusManual) {
    const assinatura = await prisma.assinatura.findUnique({ where: { id } });

    if (!assinatura) {
      throw new AppError("Assinatura não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, assinatura.unidadeId, "Assinatura não encontrada.");

    if (assinatura.status === "CONCLUIDA") {
      throw new AppError("Esta assinatura já foi concluída e não pode ser reativada.");
    }

    return prisma.assinatura.update({
      where: { id },
      data: { status },
    });
  }
}
