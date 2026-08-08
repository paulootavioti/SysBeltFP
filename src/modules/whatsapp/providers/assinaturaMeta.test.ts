import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { verificarAssinaturaMeta } from "./assinaturaMeta";

const SEGREDO = "app-secret-de-teste";

function assinar(corpo: Buffer, segredo = SEGREDO) {
  return "sha256=" + createHmac("sha256", segredo).update(corpo).digest("hex");
}

describe("verificarAssinaturaMeta", () => {
  it("aceita uma notificação legítima", () => {
    const corpo = Buffer.from(JSON.stringify({ entry: [{ id: "1" }] }), "utf8");

    expect(verificarAssinaturaMeta(corpo, assinar(corpo), SEGREDO)).toEqual({ valida: true });
  });

  it("valida corpo com acento — o caso que quebra reserialização", () => {
    // Se em vez do corpo cru a gente reserializasse o JSON parseado, este
    // seria o teste que falharia: a Meta escapa os não-ASCII e o
    // JSON.stringify do Node não. Quase todo nome brasileiro cai aqui.
    const corpo = Buffer.from(
      JSON.stringify({ nome: "João Conceição", obs: "graduação às 19h" }),
      "utf8"
    );

    expect(verificarAssinaturaMeta(corpo, assinar(corpo), SEGREDO).valida).toBe(true);
  });

  it("recusa corpo adulterado depois de assinado", () => {
    const original = Buffer.from(JSON.stringify({ valor: 10 }), "utf8");
    const adulterado = Buffer.from(JSON.stringify({ valor: 9999 }), "utf8");

    expect(verificarAssinaturaMeta(adulterado, assinar(original), SEGREDO).valida).toBe(false);
  });

  it("recusa assinatura feita com outro segredo", () => {
    const corpo = Buffer.from("{}", "utf8");

    expect(
      verificarAssinaturaMeta(corpo, assinar(corpo, "segredo-do-atacante"), SEGREDO).valida
    ).toBe(false);
  });

  it("recusa cabeçalho ausente, sem prefixo ou vazio", () => {
    const corpo = Buffer.from("{}", "utf8");

    expect(verificarAssinaturaMeta(corpo, undefined, SEGREDO).valida).toBe(false);
    expect(verificarAssinaturaMeta(corpo, "abc123", SEGREDO).valida).toBe(false);
    expect(verificarAssinaturaMeta(corpo, "sha256=", SEGREDO).valida).toBe(false);
  });

  it("recusa quando o corpo cru não foi capturado", () => {
    // se o express.json consumir o corpo sem guardar o cru, é aqui que a
    // integração falha — melhor recusar que validar contra Buffer vazio.
    const corpo = Buffer.from("{}", "utf8");

    expect(verificarAssinaturaMeta(undefined, assinar(corpo), SEGREDO).valida).toBe(false);
    expect(verificarAssinaturaMeta(Buffer.alloc(0), assinar(corpo), SEGREDO).valida).toBe(false);
  });

  it("recusa quando o App Secret não está configurado", () => {
    const corpo = Buffer.from("{}", "utf8");

    expect(verificarAssinaturaMeta(corpo, assinar(corpo), "").valida).toBe(false);
  });
});
