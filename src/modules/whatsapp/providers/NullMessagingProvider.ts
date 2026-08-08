import { randomUUID } from "crypto";

import type {
  EnvioResultado,
  EnvioTemplateDTO,
  MessagingProvider,
  StatusEntrega,
} from "./MessagingProvider";

// Provedor padrão enquanto o WhatsApp não está configurado. NÃO envia
// nada: registra o que teria sido enviado e devolve um id local.
//
// Isso é de propósito. Enquanto os templates não estão aprovados pela
// Meta, a régua de cobrança pode rodar inteira em homologação sem mandar
// mensagem nenhuma pra ninguém — e o registro no banco mostra exatamente
// o que sairia.
export class NullMessagingProvider implements MessagingProvider {
  readonly nome = "Nenhum (apenas registra)";

  async enviarTemplate(dados: EnvioTemplateDTO): Promise<EnvioResultado> {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[whatsapp:simulado] ${dados.template.nome} -> ${dados.telefone}`,
        dados.parametros
      );
    }

    return { provedorMensagemId: `simulado-${randomUUID()}` };
  }

  interpretarWebhook(): StatusEntrega[] {
    return [];
  }
}
