import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { escopoUnidade } from "../../shared/utils/escopoUnidade";

export class FinanceiroController {

  async resumo(req: Request, res: Response) {

    const unidade = escopoUnidade(req.user.unidadeId);

    const recebidas =
      await prisma.mensalidade.aggregate({
        where: {
          pago: true,
          ...unidade
        },
        _sum: {
          valor: true
        }
      });

    const pendentes =
      await prisma.mensalidade.aggregate({
        where: {
          pago: false,
          ...unidade
        },
        _sum: {
          valor: true
        }
      });

    const inadimplentes =
      await prisma.mensalidade.count({
        where: {
          pago: false,
          vencimento: {
            lt: new Date()
          },
          ...unidade
        }
      });

    return res.json({
      totalRecebido:
        recebidas._sum.valor || 0,

      totalPendente:
        pendentes._sum.valor || 0,

      inadimplentes
    });
  }

}
