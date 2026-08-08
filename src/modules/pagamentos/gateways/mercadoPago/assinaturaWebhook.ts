import { createHmac, timingSafeEqual } from "crypto";

// Verificação da assinatura do webhook do Mercado Pago.
//
// Sem isso, qualquer um que descubra a URL do webhook consegue mandar um
// "pagamento aprovado" e dar baixa numa mensalidade sem pagar. É a parte
// mais sensível da integração, por isso mora num arquivo próprio, sem
// dependência de banco nem de rede, e é testada isoladamente.
//
// O cabeçalho `x-signature` vem no formato `ts=<millis>,v1=<hmac hex>`.
// O HMAC é SHA-256, em hexadecimal, sobre um manifesto montado com o id
// do recurso (em minúsculas), o `x-request-id` e o próprio ts:
//
//   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
//
// Partes cujo valor não veio na notificação são omitidas do manifesto.

export interface EntradaVerificacao {
  assinatura: string | undefined;
  requestId: string | undefined;
  /** `data.id` da notificação (query string `data.id` ou corpo). */
  recursoId: string | undefined;
  segredo: string;
  /** Momento atual, injetável pra teste. */
  agora?: Date;
}

export type ResultadoVerificacao =
  | { valida: true }
  | { valida: false; motivo: string };

// Uma assinatura capturada não deve valer pra sempre: sem janela, um
// payload interceptado poderia ser reenviado meses depois.
const JANELA_TOLERANCIA_MS = 10 * 60 * 1000;

function extrairPartes(assinatura: string): Record<string, string> {
  const partes: Record<string, string> = {};

  for (const pedaco of assinatura.split(",")) {
    const separador = pedaco.indexOf("=");

    if (separador === -1) continue;

    const chave = pedaco.slice(0, separador).trim();
    const valor = pedaco.slice(separador + 1).trim();

    if (chave) partes[chave] = valor;
  }

  return partes;
}

export function montarManifesto(entrada: {
  recursoId?: string;
  requestId?: string;
  ts: string;
}): string {
  // A ordem é fixa e faz parte do contrato — trocar a ordem invalida a
  // comparação mesmo com os mesmos valores.
  const pedacos: string[] = [];

  if (entrada.recursoId) pedacos.push(`id:${entrada.recursoId.toLowerCase()};`);
  if (entrada.requestId) pedacos.push(`request-id:${entrada.requestId};`);
  pedacos.push(`ts:${entrada.ts};`);

  return pedacos.join("");
}

export function verificarAssinaturaMercadoPago(
  entrada: EntradaVerificacao
): ResultadoVerificacao {
  if (!entrada.segredo) {
    return { valida: false, motivo: "Segredo do webhook não configurado." };
  }

  if (!entrada.assinatura) {
    return { valida: false, motivo: "Cabeçalho x-signature ausente." };
  }

  const partes = extrairPartes(entrada.assinatura);
  const ts = partes.ts;
  const recebida = partes.v1;

  if (!ts || !recebida) {
    return { valida: false, motivo: "Cabeçalho x-signature malformado." };
  }

  const instante = Number(ts);

  if (!Number.isFinite(instante)) {
    return { valida: false, motivo: "Timestamp da assinatura inválido." };
  }

  const agora = (entrada.agora ?? new Date()).getTime();

  if (Math.abs(agora - instante) > JANELA_TOLERANCIA_MS) {
    return { valida: false, motivo: "Assinatura fora da janela de tolerância." };
  }

  const manifesto = montarManifesto({
    recursoId: entrada.recursoId,
    requestId: entrada.requestId,
    ts,
  });

  const esperada = createHmac("sha256", entrada.segredo).update(manifesto).digest("hex");

  const bufferEsperado = Buffer.from(esperada, "hex");
  const bufferRecebido = Buffer.from(recebida, "hex");

  // Comparar em tempo constante: comparação normal vaza, pelo tempo de
  // resposta, quantos caracteres iniciais estavam certos.
  if (
    bufferEsperado.length === 0 ||
    bufferEsperado.length !== bufferRecebido.length ||
    !timingSafeEqual(bufferEsperado, bufferRecebido)
  ) {
    return { valida: false, motivo: "Assinatura não confere." };
  }

  return { valida: true };
}
