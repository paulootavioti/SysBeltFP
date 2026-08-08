import { StatusAssinaturaPlataforma } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface AlterarAssinaturaDTO {
  planoId?: number;
  status?: StatusAssinaturaPlataforma;
  precoPorBlocoCentavos?: number | null;
  diaVencimento?: number;
}

// Mudanças na assinatura de um cliente: troca de plano, condição negociada,
// suspensão e cancelamento. É o painel comercial do operador do SaaS.
export class AlterarAssinaturaPlataformaService {
  async execute(contaId: number, data: AlterarAssinaturaDTO) {
    const assinatura = await prisma.assinaturaPlataforma.findUnique({ where: { contaId } });

    if (!assinatura) {
      throw new AppError("Esta conta ainda não tem assinatura da plataforma.", 404);
    }

    if (data.planoId !== undefined) {
      const plano = await prisma.planoPlataforma.findUnique({ where: { id: data.planoId } });

      if (!plano) {
        throw new AppError("Plano da plataforma não encontrado.", 404);
      }
    }

    // A data de cancelamento é carimbada na transição, não a cada
    // atualização — senão editar o dia de vencimento de uma assinatura já
    // cancelada reescreveria quando ela foi cancelada.
    const cancelando = data.status === "CANCELADA" && assinatura.status !== "CANCELADA";
    const saindoDoCancelamento = data.status !== undefined && data.status !== "CANCELADA";

    return prisma.assinaturaPlataforma.update({
      where: { contaId },
      data: {
        planoId: data.planoId,
        status: data.status,
        precoPorBlocoCentavos:
          data.precoPorBlocoCentavos === undefined ? undefined : data.precoPorBlocoCentavos,
        diaVencimento: data.diaVencimento,
        canceladaEm: cancelando ? new Date() : saindoDoCancelamento ? null : undefined,
      },
      include: { plano: true, conta: { select: { id: true, nome: true } } },
    });
  }
}
