import type { MessagingProvider } from "./MessagingProvider";
import { NullMessagingProvider } from "./NullMessagingProvider";
import { MetaCloudApiProvider } from "./MetaCloudApiProvider";

export type { MessagingProvider } from "./MessagingProvider";
export { ProvedorMensagemNaoImplementadoError } from "./MessagingProvider";

// Ponto único de escolha. Sem WHATSAPP_PROVIDER definido, nada é enviado
// de verdade — é o padrão seguro enquanto os templates não estão
// aprovados pela Meta.
export function obterProvedorMensagens(): MessagingProvider {
  if (process.env.WHATSAPP_PROVIDER === "META_CLOUD_API") {
    return new MetaCloudApiProvider();
  }

  return new NullMessagingProvider();
}
