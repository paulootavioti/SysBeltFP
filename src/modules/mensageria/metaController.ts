import type { Request, Response } from "express";
import { Prisma, type TipoCanalMensageria } from "@prisma/client";
import { verificarAssinaturaMeta } from "../whatsapp/providers/assinaturaMeta";
import { obterContextoRequisicao } from "../../shared/context/contextoRequisicao";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import type { TipoCanalExterno } from "../../shared/tenant/MensageriaDirectory";
import { infraestruturaMensageria } from "./infra";
import { extrairIdentificadorConta, normalizarMensagensMeta } from "./metaPayload";

function tipoDaRota(valor: string): TipoCanalExterno | null {
  const tipo = valor.toUpperCase();
  return tipo === "WHATSAPP" || tipo === "INSTAGRAM" ? tipo : null;
}

export class MetaWebhookController {
  async verificar(request: Request, response: Response) {
    const tipo = tipoDaRota(String(request.params.canal));
    if (!tipo || request.query["hub.mode"] !== "subscribe") return response.sendStatus(404);
    const ref = process.env[`META_${tipo}_VERIFY_TOKEN_REF`]?.trim();
    if (!ref) return response.sendStatus(503);
    try {
      const esperado = await infraestruturaMensageria().segredos.obter(ref);
      if (request.query["hub.verify_token"] !== esperado) return response.sendStatus(403);
      return response.status(200).send(String(request.query["hub.challenge"] ?? ""));
    } catch { return response.sendStatus(503); }
  }

  async receber(request: Request, response: Response) {
    const tipo = tipoDaRota(String(request.params.canal));
    if (!tipo) return response.sendStatus(404);
    const identificador = extrairIdentificadorConta(tipo, request.body);
    if (!identificador) return response.sendStatus(200);
    const infra = infraestruturaMensageria();
    const conta = await infra.diretorio.resolver(tipo, identificador);
    // Resposta indistinguível evita transformar o endpoint em enumerador de contas.
    if (!conta || conta.status !== "ATIVO") return response.sendStatus(200);
    const appSecret = await infra.segredos.obter(conta.appSecretRef);
    if (!verificarAssinaturaMeta(request.corpoCru, request.header("x-hub-signature-256") ?? undefined, appSecret).valida) {
      return response.sendStatus(401);
    }
    const mensagens = normalizarMensagensMeta(tipo, request.body);
    if (!mensagens.length) return response.sendStatus(200);
    const requestId = obterContextoRequisicao().requestId ?? "webhook-meta";
    const prisma = prismaDaRequisicao();
    const contaLocal = await prisma.conta.findUnique({ where: { tenantKey: conta.tenantKey }, select: { id: true } });
    if (!contaLocal) return response.sendStatus(200);
    const canal = await prisma.canalMensageria.findFirst({
        where: { tipo: tipo as TipoCanalMensageria, identificadorExterno: identificador, ativo: true, unidade: { contaId: contaLocal.id } }, select: { id: true },
      });
    if (!canal) return response.sendStatus(200);
    await prisma.eventoMensageriaEntrada.createMany({
        data: mensagens.map((mensagem) => ({
          canalMensageriaId: canal.id,
          eventoExternoId: mensagem.eventoExternoId,
          payload: { ...mensagem, requestId } as unknown as Prisma.InputJsonValue,
        })),
        skipDuplicates: true,
      });
    return response.sendStatus(200);
  }
}
