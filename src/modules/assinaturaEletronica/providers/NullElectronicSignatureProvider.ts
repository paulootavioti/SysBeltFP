import { randomUUID } from "crypto";

import type {
  DocumentoAssinadoResultado,
  ElectronicSignatureProvider,
  EnviarParaAssinaturaDTO,
  EnviarParaAssinaturaResultado,
  WebhookEventoAssinatura,
} from "./ElectronicSignatureProvider";

// Provedor "manual" — é o que roda hoje na prática: o Administrador
// registra a assinatura (digital/eletrônica/presencial) e opcionalmente
// faz upload do contrato assinado direto no sistema
// (RegistrarAssinaturaService), sem nenhuma plataforma externa. É o
// provedor padrão até que uma integração real seja configurada.
export class NullElectronicSignatureProvider implements ElectronicSignatureProvider {
  readonly nome = "Manual";

  async enviarParaAssinatura(_dados: EnviarParaAssinaturaDTO): Promise<EnviarParaAssinaturaResultado> {
    return {
      provedorDocumentoId: `manual-${randomUUID()}`,
      status: "AGUARDANDO_ASSINATURA_MANUAL",
      linkAssinatura: undefined,
    };
  }

  async consultarStatus(): Promise<string> {
    return "AGUARDANDO_ASSINATURA_MANUAL";
  }

  async cancelarSolicitacao(): Promise<void> {
    // nada a fazer — não há provedor externo pra avisar.
  }

  async baixarDocumentoAssinado(): Promise<DocumentoAssinadoResultado> {
    // no fluxo manual o próprio Administrador faz o upload do documento
    // assinado (Contrato.contratoAssinadoUrl) — não há nada a baixar aqui.
    throw new Error("Não aplicável: o documento assinado é enviado manualmente pelo Administrador.");
  }

  async processarWebhook(payload: unknown): Promise<WebhookEventoAssinatura> {
    return { tipo: "NAO_APLICAVEL", payload };
  }
}
