import { createHmac } from "crypto";
import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { assinaturaValida } from "./controller";

function requisicao(corpo: Buffer, assinatura?: string): Request {
  return { corpoCru: corpo, headers: { "x-autentique-signature": assinatura } } as unknown as Request;
}

describe("assinatura do webhook do Autentique", () => {
  it("aceita o HMAC SHA-256 calculado sobre o corpo cru", () => {
    const corpo = Buffer.from('{"event":{"type":"document.finished"}}');
    const assinatura = createHmac("sha256", "segredo").update(corpo).digest("hex");
    expect(assinaturaValida(requisicao(corpo, assinatura), "segredo")).toBe(true);
  });

  it("recusa payload alterado e configuração ausente", () => {
    const assinatura = createHmac("sha256", "segredo").update("original").digest("hex");
    expect(assinaturaValida(requisicao(Buffer.from("alterado"), assinatura), "segredo")).toBe(false);
    expect(assinaturaValida(requisicao(Buffer.from("original"), assinatura), undefined)).toBe(false);
  });
});
