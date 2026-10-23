import { randomUUID } from "crypto";

import type {
  EnvioResultado,
  EnvioTemplateDTO,
  MessagingProvider,
  StatusEntrega,
} from "./MessagingProvider";
import { logger } from "../../../shared/observability/logger";

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
      // Parâmetros ficam de fora (nome de aluno, valores); o registro
      // completo do que sairia já está no banco.
      logger.info("whatsapp_simulado", {
        template: dados.template.nome,
        telefone: `****${dados.telefone.slice(-4)}`,
      });
    }

    return { provedorMensagemId: `simulado-${randomUUID()}` };
  }

  interpretarWebhook(): StatusEntrega[] {
    return [];
  }
}
