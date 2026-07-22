import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class GetMensalidadesVencidasService {

  async execute() {

    const hoje = new Date();

    const mensalidades =
      await prisma.mensalidade.findMany({
        take: LIMITE_PADRAO_LISTAGEM,
        where: {
          pago: false,
          vencimento: {
            lt: hoje
          }
        },
        include: {
          aluno: true
        }
      });

    return mensalidades;
  }

}