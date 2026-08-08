import { createHmac, timingSafeEqual } from "crypto";

// Verificação da assinatura do webhook da Meta.
//
// O cabeçalho é `X-Hub-Signature-256: sha256=<hex>`, um HMAC-SHA256 do
// corpo da requisição com o App Secret.
//
// A pegadinha: o HMAC é sobre o corpo **cru**, byte a byte, como chegou.
// Reserializar o JSON já parseado não funciona — a Meta escapa caracteres
// não-ASCII (`á` em vez de `á`), e `JSON.stringify` do Node não faz
// isso. Num sistema em português, com acento em quase todo nome, isso
// significa que a verificação falharia justamente nas mensagens reais e
// passaria nos testes com texto sem acento.
//
// Por isso o corpo cru é capturado no `express.json({ verify })` (ver
// app.ts) e chega aqui como Buffer.

export type ResultadoVerificacao =
  | { valida: true }
  | { valida: false; motivo: string };

export function verificarAssinaturaMeta(
  corpoCru: Buffer | undefined,
  cabecalho: string | undefined,
  segredo: string
): ResultadoVerificacao {
  if (!segredo) {
    // Falha fechado: sem segredo configurado nenhuma notificação é
    // confiável, e aceitar tudo deixaria qualquer um forjar entrega.
    return { valida: false, motivo: "App Secret não configurado." };
  }

  if (!corpoCru || corpoCru.length === 0) {
    return { valida: false, motivo: "Corpo cru da requisição indisponível." };
  }

  if (!cabecalho?.startsWith("sha256=")) {
    return { valida: false, motivo: "Cabeçalho X-Hub-Signature-256 ausente ou malformado." };
  }

  const recebida = cabecalho.slice("sha256=".length).trim();
  const esperada = createHmac("sha256", segredo).update(corpoCru).digest("hex");

  const bufferEsperado = Buffer.from(esperada, "hex");
  const bufferRecebido = Buffer.from(recebida, "hex");

  if (
    bufferRecebido.length === 0 ||
    bufferEsperado.length !== bufferRecebido.length ||
    !timingSafeEqual(bufferEsperado, bufferRecebido)
  ) {
    return { valida: false, motivo: "Assinatura não confere." };
  }

  return { valida: true };
}
