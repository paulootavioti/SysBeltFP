import { logger } from "../observability/logger";

export interface EmailService {
  enviar(destinatario: string, assunto: string, corpo: string): Promise<void>;
}

// Implementação padrão até que um provedor real seja configurado — apenas
// registra o envio, sem SMTP/API key nenhuma.
export class NullEmailService implements EmailService {
  async enviar(destinatario: string, assunto: string, _corpo: string): Promise<void> {
    // O corpo nunca vai para o log: e-mails de redefinição carregam um
    // token de uso único, e o log da hospedagem não é lugar de credencial.
    const destinatarioMascarado = mascararEmail(destinatario);
    if (process.env.NODE_ENV === "production") {
      logger.error("email_nao_enviado", new Error("EMAIL_PROVIDER_NOT_CONFIGURED"), { destinatario: destinatarioMascarado, assunto });
      return;
    }
    logger.info("email_simulado", { destinatario: destinatarioMascarado, assunto });
  }
}

export class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly remetente: string,
  ) {}

  async enviar(destinatario: string, assunto: string, corpo: string): Promise<void> {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: this.remetente, to: [destinatario], subject: assunto, text: corpo }),
    });

    if (!resposta.ok) {
      throw new Error(`EMAIL_PROVIDER_ERROR:${resposta.status}`);
    }
  }
}

export function mascararEmail(email: string): string {
  return email.replace(/^(.)[^@]*(@.*)$/, "$1***$2");
}

export function obterEmailService(env: NodeJS.ProcessEnv = process.env): EmailService {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendEmailService(env.RESEND_API_KEY, env.EMAIL_FROM);
  }

  if (env.NODE_ENV === "production") {
    logger.error(
      "email_provedor_ausente",
      new Error("RESEND_API_KEY/EMAIL_FROM ausentes: e-mails de redefinição de senha NÃO serão entregues"),
    );
  }

  return new NullEmailService();
}
