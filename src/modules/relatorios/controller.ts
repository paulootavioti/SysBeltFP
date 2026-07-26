import { Request, Response } from "express";

import { RelatorioEvolucaoService } from "./services/RelatorioEvolucaoService";
import { RelatorioFinanceiroService } from "./services/RelatorioFinanceiroService";
import { RelatorioRankingService } from "./services/RelatorioRankingService";
import { RelatorioAniversariantesService } from "./services/RelatorioAniversariantesService";
import { RelatorioComportamentalService } from "./services/RelatorioComportamentalService";

export class RelatoriosController {

  async evolucao(
    req: Request,
    res: Response
  ) {

    const { alunoId } =
      req.params;

    const service =
      new RelatorioEvolucaoService();

    const relatorio =
      await service.execute(
        Number(alunoId),
        req.user.unidadeId
      );

    return res.json(relatorio);

  }

  async financeiro(req: Request, res: Response) {
    const service =
      new RelatorioFinanceiroService();

    const relatorio =
      await service.execute(req.user.unidadeId);

    return res.json(relatorio);
  }

  async ranking(req: Request, res: Response) {
    const service = new RelatorioRankingService();

    const relatorio = await service.execute(req.user.unidadeId);

    return res.json(relatorio);
  }

  async aniversariantes(
    req: Request,
    res: Response
  ) {

    const service =
      new RelatorioAniversariantesService();

    const relatorio =
      await service.execute(req.user.unidadeId);

    return res.json(relatorio);

  }

  async comportamental(
    req: Request,
    res: Response
  ) {

    const { alunoId } =
      req.params;

    const service =
      new RelatorioComportamentalService();

    const relatorio =
      await service.execute(
        Number(alunoId),
        req.user.unidadeId
      );

    return res.json(relatorio);

  }
}
