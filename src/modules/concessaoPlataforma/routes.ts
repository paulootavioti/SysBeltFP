import { Router } from "express";

import { AplicarConcessaoService } from "./AplicarConcessaoService";
import { concessaoV1Schema } from "./concessaoContrato";

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
    if (erro instanceof Error && (
      erro.message.includes("Assinatura") ||
      erro.message.includes("outro tenant") ||
      erro.message.includes("expirada") ||
      erro.message.includes("futuro")
    )) {
      return response.status(401).json({ mensagem: "Concessão não autorizada." });
    }
    if (erro instanceof Error && (
      erro.message.includes("revisão anterior") ||
      erro.message.includes("Conflito na revisão")
    )) {
      return response.status(409).json({ mensagem: "Conflito de revisão da concessão." });
    }
    throw erro;
  }
});
