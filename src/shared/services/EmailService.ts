export interface EmailService {
  enviar(destinatario: string, assunto: string, corpo: string): Promise<void>;
}

// Implementação padrão até que um provedor real seja configurado — apenas
// registra o envio, sem SMTP/API key nenhuma.
export class NullEmailService implements EmailService {
  async enviar(destinatario: string, assunto: string, corpo: string): Promise<void> {
    console.log(`[EmailService] (stub) e-mail para ${destinatario} — "${assunto}"\n${corpo}`);
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

export function obterEmailService(env: NodeJS.ProcessEnv = process.env): EmailService {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendEmailService(env.RESEND_API_KEY, env.EMAIL_FROM);
  }

  return new NullEmailService();
}
