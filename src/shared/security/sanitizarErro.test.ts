import { describe, expect, it } from "vitest";

import { erroSeguroParaLog, sanitizarTextoParaLog } from "./sanitizarErro";

describe("sanitização de erros para logs", () => {
  it("remove connection strings, tokens e segredo do diretório", () => {
    const texto = [
      "falha em postgresql://usuario:senha@host/banco?sslmode=require",
      "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature",
      'x-sysbelt-directory-secret="segredo-interno"',
    ].join(" | ");

    const resultado = sanitizarTextoParaLog(texto);
    expect(resultado).not.toContain("usuario:senha");
    expect(resultado).not.toContain("eyJhbGci");
    expect(resultado).not.toContain("segredo-interno");
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
