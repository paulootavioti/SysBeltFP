import { Request, Response } from "express";

import { LembreteSemanalService } from "./services/LembreteSemanalService";
import { LembreteVencimentoService } from "./services/LembreteVencimentoService";
import { LembreteAtrasoService } from "./services/LembreteAtrasoService";
import { RelatorioMensalService } from "./services/RelatorioMensalService";
import { CongratulacoesGraduacaoService } from "./services/CongratulacoesGraduacaoService";
import { AusenciaService } from "./services/AusenciaService";

export class MensagensController {

  async lembreteSemanal(req: Request, res: Response) {
    const service = new LembreteSemanalService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

  async lembreteVencimento(req: Request, res: Response) {
    const service = new LembreteVencimentoService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

  async lembreteAtraso(req: Request, res: Response) {
    const service = new LembreteAtrasoService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

  async relatorioMensal(req: Request, res: Response) {
    const service = new RelatorioMensalService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

  async congratulacoesGraduacao(req: Request, res: Response) {
    const service = new CongratulacoesGraduacaoService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

  async ausencia(req: Request, res: Response) {
    const service = new AusenciaService();
    const mensagens = await service.execute(req.user.unidadeId);
    return res.json(mensagens);
  }

}
