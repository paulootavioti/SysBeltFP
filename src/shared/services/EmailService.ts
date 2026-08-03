// Camada de abstração de envio de e-mail. Nenhum provedor real está
// integrado ainda (mesmo estágio de PaymentGateway — ver
// src/modules/pagamentos/gateways/NullPaymentGateway.ts): esta interface e
// o stub abaixo existem pra que, quando um provedor (SMTP, SES, Resend etc.)
// for configurado, nenhuma regra de negócio precise mudar — elas sempre
// conversam com um `EmailService`, nunca com o SDK de um provedor específico.

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

export function obterEmailService(): EmailService {
  return new NullEmailService();
}
