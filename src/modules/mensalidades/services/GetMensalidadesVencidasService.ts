import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetMensalidadesVencidasService {

  async execute(unidadeId: number | null) {

    const hoje = new Date();

    const mensalidades =
      await prisma.mensalidade.findMany({
        take: LIMITE_PADRAO_LISTAGEM,
        where: {
          pago: false,
          status: { notIn: ["CANCELADA", "ESTORNADA"] },
          vencimento: {
            lt: hoje
          },
          ...escopoUnidade(unidadeId)
        },
        orderBy: { vencimento: "asc" },
        include: {
          aluno: true,
          formaPagamento: true,
        }
      });

    return mensalidades;
  }

}