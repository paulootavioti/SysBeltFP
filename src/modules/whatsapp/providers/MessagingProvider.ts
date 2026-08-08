import type { DefinicaoTemplate } from "../templates";

export interface EnvioTemplateDTO {
  /** telefone em E.164, ex.: 5511987654321 */
  telefone: string;
  template: DefinicaoTemplate;
  /** valores de {{1}}, {{2}}... na ordem declarada no template */
  parametros: string[];
}

export interface EnvioResultado {
  provedorMensagemId: string;
}

export interface StatusEntrega {
  provedorMensagemId: string;
  situacao: "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHOU";
  erro?: string | null;
  ocorridoEm: Date;
}

export interface MessagingProvider {
  readonly nome: string;
  enviarTemplate(dados: EnvioTemplateDTO): Promise<EnvioResultado>;
  /** Traduz o corpo do webhook em atualizações de entrega. */
  interpretarWebhook(payload: unknown): StatusEntrega[];
}

// Falha explícita é melhor que silêncio: se alguém configurar um provedor
// que não existe, o envio precisa quebrar, não sumir.
export class ProvedorMensagemNaoImplementadoError extends Error {
  constructor(nome: string) {
    super(`Integração de mensagens com ${nome} ainda não implementada.`);
  }
}
