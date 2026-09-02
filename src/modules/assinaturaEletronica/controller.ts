import { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { Prisma } from "@prisma/client";

// Endpoint de recebimento de webhooks de provedor de assinatura eletrônica
// — estrutura pra fase futura de integração real. Até lá, nenhum provedor
// está configurado (ver src/modules/assinaturaEletronica/providers), então
// qualquer chamada aqui só pode vir de uma integração ainda não habilitada.
export class AssinaturaEletronicaController {
  async webhook(req: Request, res: Response) {
    if (String(req.params.provedor).toUpperCase() !== "AUTENTIQUE") {
      return res.status(501).json({ erro: `Webhook do provedor "${req.params.provedor}" ainda não está integrado.` });
    }
    if (!assinaturaValida(req, process.env.AUTENTIQUE_WEBHOOK_SECRET)) {
      return res.status(401).json({ erro: "Assinatura inválida." });
    }

    const evento = req.body?.event;
    const documentoId = evento?.type?.startsWith("signature.")
      ? evento?.data?.document
      : evento?.data?.object?.id;
    if (!evento?.id || !evento?.type || !documentoId) return res.status(200).json({ resultado: "IGNORADO" });

    const prisma = prismaDaRequisicao();
    const solicitacao = await prisma.solicitacaoAssinatura.findFirst({
      where: { provedor: "AUTENTIQUE", provedorDocumentoId: String(documentoId) },
    });
    if (!solicitacao) return res.status(200).json({ resultado: "NAO_ENCONTRADO" });

    let eventoPersistido;
    try {
      eventoPersistido = await prisma.eventoAssinaturaEletronica.create({
        data: {
          solicitacaoId: solicitacao.id,
          eventoExternoId: String(evento.id),
          tipo: evento.type,
          payload: req.body as Prisma.InputJsonValue,
        },
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
        return res.status(200).json({ resultado: "JA_PROCESSADO" });
      }
      throw erro;
    }

    const concluido = evento.type === "document.finished";
    const recusado = evento.type === "signature.rejected";
    const url = evento.data.object.files?.signed ?? null;
    await prisma.$transaction([
      prisma.solicitacaoAssinatura.update({
        where: { id: solicitacao.id },
        data: {
          status: concluido ? "CONCLUIDO" : recusado ? "RECUSADO" : solicitacao.status,
          documentoAssinadoUrl: concluido ? url : solicitacao.documentoAssinadoUrl,
          concluidoEm: concluido ? new Date() : solicitacao.concluidoEm,
        },
      }),
      ...(concluido ? [prisma.contrato.update({
        where: { id: solicitacao.contratoId },
        data: { situacao: "ASSINADO" as const, tipoAssinatura: "ELETRONICA" as const, assinadoEm: new Date(), contratoAssinadoUrl: url },
      })] : []),
      prisma.eventoAssinaturaEletronica.update({
        where: { id: eventoPersistido.id },
        data: { processadoEm: new Date(), resultado: concluido ? "CONTRATO_ASSINADO" : recusado ? "RECUSADO" : "REGISTRADO" },
      }),
    ]);
    return res.status(200).json({ resultado: concluido ? "CONTRATO_ASSINADO" : "ATUALIZADO" });
  }
}

export function assinaturaValida(req: Request, segredo: string | undefined): boolean {
  const cabecalho = req.headers["x-autentique-signature"];
  const recebida = Array.isArray(cabecalho) ? cabecalho[0] : cabecalho;
  if (!segredo || !recebida || !req.corpoCru) return false;
  const calculada = createHmac("sha256", segredo).update(req.corpoCru).digest("hex");
  const a = Buffer.from(calculada, "hex");
  const b = Buffer.from(recebida, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
