import { Request, Response } from "express";

import { RegistrarConsentimentoService } from "./services/RegistrarConsentimentoService";
import { RevogarConsentimentoService } from "./services/RevogarConsentimentoService";
import { ConsultarConsentimentoService } from "./services/ConsultarConsentimentoService";

export class ConsentimentosController {
  async registrar(req: Request, res: Response) {
    const service = new RegistrarConsentimentoService();

    const consentimento = await service.execute(req.body, req.user.unidadeId, req.user.id);

    return res.status(201).json(consentimento);
  }

  async revogar(req: Request, res: Response) {
    const service = new RevogarConsentimentoService();

    const consentimento = await service.execute(
      Number(req.params.id),
      req.user.unidadeId,
      req.user.id
    );

    return res.json(consentimento);
  }

  async historicoDoAluno(req: Request, res: Response) {
    const service = new ConsultarConsentimentoService();

    const historico = await service.historico(Number(req.params.alunoId));

    return res.json(historico);
  }

  async situacaoDoAluno(req: Request, res: Response) {
    const service = new ConsultarConsentimentoService();

    const alunoId = Number(req.params.alunoId);

    const situacoes = await Promise.all(
      (["USO_IMAGEM", "BIOMETRIA", "DADOS_SAUDE", "COMUNICACOES"] as const).map((tipo) =>
        service.situacaoAtual(alunoId, tipo)
      )
    );

    return res.json(situacoes);
  }
}
