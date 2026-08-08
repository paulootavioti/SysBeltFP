import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import {
  montarManifesto,
  verificarAssinaturaMercadoPago,
} from "./assinaturaWebhook";

const SEGREDO = "segredo-de-teste-do-webhook";
const AGORA = new Date("2026-08-10T12:00:00Z");

function assinar(manifesto: string, segredo = SEGREDO) {
  return createHmac("sha256", segredo).update(manifesto).digest("hex");
}

function notificacaoValida(overrides: Partial<Parameters<typeof verificarAssinaturaMercadoPago>[0]> = {}) {
  const ts = String(AGORA.getTime());
  const recursoId = "123456";
  const requestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";

  const manifesto = montarManifesto({ recursoId, requestId, ts });

  return {
    assinatura: `ts=${ts},v1=${assinar(manifesto)}`,
    requestId,
    recursoId,
    segredo: SEGREDO,
    agora: AGORA,
    ...overrides,
  };
}

describe("montarManifesto", () => {
  it("segue o formato do Mercado Pago, com id em minúsculas", () => {
    expect(
      montarManifesto({ recursoId: "ORD01JQ4S4KY8HW", requestId: "req-1", ts: "1742505638683" })
    ).toBe("id:ord01jq4s4ky8hw;request-id:req-1;ts:1742505638683;");
  });

  it("omite as partes que não vieram na notificação", () => {
    expect(montarManifesto({ ts: "1742505638683" })).toBe("ts:1742505638683;");
    expect(montarManifesto({ recursoId: "9", ts: "1" })).toBe("id:9;ts:1;");
  });
});

describe("verificarAssinaturaMercadoPago", () => {
  it("aceita uma notificação legítima", () => {
    expect(verificarAssinaturaMercadoPago(notificacaoValida())).toEqual({ valida: true });
  });

  it("recusa assinatura feita com outro segredo", () => {
    const ts = String(AGORA.getTime());
    const manifesto = montarManifesto({ recursoId: "123456", requestId: "req", ts });

    const resultado = verificarAssinaturaMercadoPago({
      assinatura: `ts=${ts},v1=${assinar(manifesto, "segredo-do-atacante")}`,
      requestId: "req",
      recursoId: "123456",
      segredo: SEGREDO,
      agora: AGORA,
    });

    expect(resultado).toEqual({ valida: false, motivo: "Assinatura não confere." });
  });

  it("recusa quando o id do recurso foi trocado depois de assinar", () => {
    // é o ataque que importa: pegar uma notificação legítima de um
    // pagamento pequeno e apontá-la pra outro.
    const resultado = verificarAssinaturaMercadoPago(
      notificacaoValida({ recursoId: "999999" })
    );

    expect(resultado.valida).toBe(false);
  });

  it("recusa assinatura antiga, mesmo sendo autêntica", () => {
    const resultado = verificarAssinaturaMercadoPago(
      notificacaoValida({ agora: new Date(AGORA.getTime() + 60 * 60 * 1000) })
    );

    expect(resultado).toEqual({
      valida: false,
      motivo: "Assinatura fora da janela de tolerância.",
    });
  });

  it("aceita pequeno desvio de relógio entre servidores", () => {
    const resultado = verificarAssinaturaMercadoPago(
      notificacaoValida({ agora: new Date(AGORA.getTime() + 2 * 60 * 1000) })
    );

    expect(resultado.valida).toBe(true);
  });

  it("recusa cabeçalho ausente, malformado ou sem v1", () => {
    expect(verificarAssinaturaMercadoPago(notificacaoValida({ assinatura: undefined })).valida).toBe(false);
    expect(verificarAssinaturaMercadoPago(notificacaoValida({ assinatura: "lixo" })).valida).toBe(false);
    expect(
      verificarAssinaturaMercadoPago(notificacaoValida({ assinatura: `ts=${AGORA.getTime()}` })).valida
    ).toBe(false);
  });

  it("recusa v1 vazio ou não-hexadecimal em vez de deixar passar", () => {
    const ts = String(AGORA.getTime());

    expect(verificarAssinaturaMercadoPago(notificacaoValida({ assinatura: `ts=${ts},v1=` })).valida).toBe(false);
    expect(
      verificarAssinaturaMercadoPago(notificacaoValida({ assinatura: `ts=${ts},v1=zzzz` })).valida
    ).toBe(false);
  });

  it("recusa quando o segredo não está configurado, em vez de aceitar tudo", () => {
    // falha fechado: sem segredo, nenhuma notificação é confiável.
    expect(verificarAssinaturaMercadoPago(notificacaoValida({ segredo: "" })).valida).toBe(false);
  });

  it("valida também quando a notificação não traz request-id", () => {
    const ts = String(AGORA.getTime());
    const manifesto = montarManifesto({ recursoId: "77", ts });

    const resultado = verificarAssinaturaMercadoPago({
      assinatura: `ts=${ts},v1=${assinar(manifesto)}`,
      requestId: undefined,
      recursoId: "77",
      segredo: SEGREDO,
      agora: AGORA,
    });

    expect(resultado.valida).toBe(true);
  });
});
