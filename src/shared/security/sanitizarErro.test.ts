import { describe, expect, it } from "vitest";

import { erroSeguroParaLog, sanitizarTextoParaLog } from "./sanitizarErro";

describe("sanitização de erros para logs", () => {
  it("remove connection strings, tokens e segredo do diretório", () => {
    const texto = [
      "falha em postgresql://usuario:senha@host/banco?sslmode=require",
      "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature",
      'x-sysbelt-directory-secret="segredo-interno"',
      "GET https://graph.facebook.com/oauth/access_token?client_id=1&client_secret=abc-segredo&code=codigo-oauth",
      "https://graph.instagram.com/refresh_access_token?access_token=IGQ-token-longo&grant_type=x",
    ].join(" | ");

    const resultado = sanitizarTextoParaLog(texto);
    expect(resultado).not.toContain("usuario:senha");
    expect(resultado).not.toContain("eyJhbGci");
    expect(resultado).not.toContain("segredo-interno");
    expect(resultado).not.toContain("abc-segredo");
    expect(resultado).not.toContain("codigo-oauth");
    expect(resultado).not.toContain("IGQ-token-longo");
    expect(resultado).toContain("client_id=1");
    expect(resultado).toContain("[CONNECTION_STRING_REDACTED]");
    expect(resultado).toContain("Bearer [TOKEN_REDACTED]");
  });

  it("preserva diagnóstico não sensível e nunca devolve o Error bruto", () => {
    const resultado = erroSeguroParaLog(
      new Error("timeout ao conectar em postgres://admin:secreta@db/tenant"),
    );
    expect(resultado).toMatchObject({ name: "Error" });
    expect(resultado.message).toContain("timeout ao conectar");
    expect(JSON.stringify(resultado)).not.toContain("secreta");
  });
});
