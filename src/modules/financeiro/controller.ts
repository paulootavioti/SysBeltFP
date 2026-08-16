import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../shared/utils/escopoUnidade";
import { AppError } from "../../shared/errors/AppError";

import { GetContasAReceberService } from "./services/GetContasAReceberService";
import { GetContasPagasService } from "./services/GetContasPagasService";
import { GetContasVencidasService } from "./services/GetContasVencidasService";
import { GetCobrancasCanceladasService } from "./services/GetCobrancasCanceladasService";
import { GetEstornosService } from "./services/GetEstornosService";
import { GetFluxoCaixaService } from "./services/GetFluxoCaixaService";
import { GetDashboardFinanceiroService } from "./services/GetDashboardFinanceiroService";
import { ExportarRelatorioService, TIPOS_EXPORTACAO, type TipoExportacao } from "./services/ExportarRelatorioService";
import { lerFiltrosDaQuery } from "./utils/filtros";

export class FinanceiroController {

  async resumo(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

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
          status: { notIn: ["CANCELADA", "ESTORNADA"] },
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
          status: { notIn: ["CANCELADA", "ESTORNADA"] },
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

  async contasAReceber(req: Request, res: Response) {
    const service = new GetContasAReceberService();
    const contas = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(contas);
  }

  async contasPagas(req: Request, res: Response) {
    const service = new GetContasPagasService();
    const contas = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(contas);
  }

  async contasVencidas(req: Request, res: Response) {
    const service = new GetContasVencidasService();
    const contas = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(contas);
  }

  async canceladas(req: Request, res: Response) {
    const service = new GetCobrancasCanceladasService();
    const contas = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(contas);
  }

  async estornos(req: Request, res: Response) {
    const service = new GetEstornosService();
    const contas = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(contas);
  }

  async fluxoCaixa(req: Request, res: Response) {
    const service = new GetFluxoCaixaService();
    const fluxo = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(fluxo);
  }

  async dashboard(req: Request, res: Response) {
    const service = new GetDashboardFinanceiroService();
    const dashboard = await service.execute(req.user.unidadeId, lerFiltrosDaQuery(req.query));
    return res.json(dashboard);
  }

  async exportar(req: Request, res: Response) {
    const tipo = String(req.query.tipo || "").toUpperCase();

    if (!TIPOS_EXPORTACAO.includes(tipo as TipoExportacao)) {
      throw new AppError(`Tipo de exportação inválido. Use um de: ${TIPOS_EXPORTACAO.join(", ")}.`);
    }

    const service = new ExportarRelatorioService();
    const csv = await service.execute(tipo as TipoExportacao, req.user.unidadeId, lerFiltrosDaQuery(req.query));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="financeiro-${tipo.toLowerCase()}.csv"`);

    return res.send(csv);
  }

}
