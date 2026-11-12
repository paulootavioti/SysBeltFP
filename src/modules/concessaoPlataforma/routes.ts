import { Router } from "express";

import { logger } from "../../shared/observability/logger";
import { AplicarConcessaoService } from "./AplicarConcessaoService";
import { ConcessaoConflitoError, ConcessaoRecusadaError, concessaoV1Schema } from "./concessaoContrato";

export const concessaoPlataformaRoutes = Router();

concessaoPlataformaRoutes.post("/v1/concessao", async (request, response) => {
  const validacao = concessaoV1Schema.safeParse(request.body);
  if (!validacao.success) {
    return response.status(400).json({ mensagem: "Concessão inválida." });
  }

  try {
    const resultado = await new AplicarConcessaoService().execute(validacao.data);
    return response.status(resultado.duplicada ? 200 : 201).json(resultado);
  } catch (erro) {
    if (erro instanceof ConcessaoRecusadaError || erro instanceof ConcessaoConflitoError) {
      // Sem o payload: só o motivo e a identificação, para investigar uma
      // conta que perdeu acesso sem expor a concessão no log.
      logger.warn("concessao_rejeitada", {
        motivo: erro.message,
        tenantKey: validacao.data.tenantKey,
        revisao: validacao.data.revisao,
      });
      return erro instanceof ConcessaoConflitoError
        ? response.status(409).json({ mensagem: "Conflito de revisão da concessão." })
        : response.status(401).json({ mensagem: "Concessão não autorizada." });
    }
    throw erro;
  }
});
