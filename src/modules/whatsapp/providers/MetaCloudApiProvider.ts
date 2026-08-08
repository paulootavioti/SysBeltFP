import { AppError } from "../../../shared/errors/AppError";
import type {
  EnvioResultado,
  EnvioTemplateDTO,
  MessagingProvider,
  StatusEntrega,
} from "./MessagingProvider";

// WhatsApp Cloud API, direto da Meta — sem intermediário. Usa o `fetch`
// global; a superfície que o sistema precisa é uma chamada.

const VERSAO_API = "v22.0";
const TIMEOUT_MS = 15_000;

export function tokenMeta(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!token) {
    throw new AppError("WhatsApp não configurado (WHATSAPP_ACCESS_TOKEN ausente).", 503);
  }

  return token;
}

export function numeroRemetenteId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!id) {
    throw new AppError("WhatsApp não configurado (WHATSAPP_PHONE_NUMBER_ID ausente).", 503);
  }

  return id;
}

export function segredoAplicativoMeta(): string {
  return process.env.WHATSAPP_APP_SECRET ?? "";
}

export function tokenVerificacaoWebhook(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN ?? "";
}

interface RespostaEnvio {
  messages?: { id: string }[];
  error?: { message?: string; code?: number };
}

export class MetaCloudApiProvider implements MessagingProvider {
  readonly nome = "WhatsApp Cloud API (Meta)";

  async enviarTemplate(dados: EnvioTemplateDTO): Promise<EnvioResultado> {
    const controle = new AbortController();
    const alarme = setTimeout(() => controle.abort(), TIMEOUT_MS);

    try {
      const resposta = await fetch(
        `https://graph.facebook.com/${VERSAO_API}/${numeroRemetenteId()}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenMeta()}`,
            "Content-Type": "application/json",
          },
          signal: controle.signal,
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: dados.telefone,
            type: "template",
            template: {
              name: dados.template.nome,
              language: { code: dados.template.idioma },
              components: dados.parametros.length
                ? [
                    {
                      type: "body",
                      parameters: dados.parametros.map((texto) => ({ type: "text", text: texto })),
                    },
                  ]
                : [],
            },
          }),
        }
      );

      const corpo = (await resposta.json().catch(() => null)) as RespostaEnvio | null;

      if (!resposta.ok) {
        throw new AppError(
          `WhatsApp respondeu ${resposta.status}: ${corpo?.error?.message ?? "sem detalhe"}`,
          502
        );
      }

      const id = corpo?.messages?.[0]?.id;

      if (!id) {
        // Sem id não dá pra correlacionar o webhook de entrega depois.
        throw new AppError("WhatsApp aceitou o envio mas não devolveu id da mensagem.", 502);
      }

      return { provedorMensagemId: id };
    } catch (erro) {
      if (erro instanceof AppError) throw erro;

      if (erro instanceof Error && erro.name === "AbortError") {
        throw new AppError("WhatsApp não respondeu a tempo.", 504);
      }

      throw new AppError("Falha ao falar com o WhatsApp.", 502);
    } finally {
      clearTimeout(alarme);
    }
  }

  // A Meta entrega os status aninhados em entry[].changes[].value.statuses[],
  // e manda vários numa mesma requisição.
  interpretarWebhook(payload: unknown): StatusEntrega[] {
    const corpo = (payload ?? {}) as {
      entry?: {
        changes?: {
          value?: {
            statuses?: {
              id?: string;
              status?: string;
              timestamp?: string;
              errors?: { title?: string; message?: string }[];
            }[];
          };
        }[];
      }[];
    };

    const atualizacoes: StatusEntrega[] = [];

    for (const entrada of corpo.entry ?? []) {
      for (const mudanca of entrada.changes ?? []) {
        for (const status of mudanca.value?.statuses ?? []) {
          if (!status.id) continue;

          const situacao = traduzirStatus(status.status);

          if (!situacao) continue;

          const erro = status.errors?.[0];

          atualizacoes.push({
            provedorMensagemId: status.id,
            situacao,
            erro: erro ? (erro.message ?? erro.title ?? "erro sem descrição") : null,
            // timestamp vem em segundos, não milissegundos.
            ocorridoEm: status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date(),
          });
        }
      }
    }

    return atualizacoes;
  }
}

function traduzirStatus(status?: string): StatusEntrega["situacao"] | null {
  switch (status) {
    case "sent":
      return "ENVIADA";
    case "delivered":
      return "ENTREGUE";
    case "read":
      return "LIDA";
    case "failed":
      return "FALHOU";
    default:
      // "deleted" e status futuros não mudam nada do nosso lado.
      return null;
  }
}
