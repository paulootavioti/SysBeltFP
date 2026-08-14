import { describe, expect, it } from "vitest";
import { extrairSlugTenant } from "./TenantHostParser";

const opcoes = { dominioBase: "app.sysbelt.com.br" };

describe("TenantHostParser", () => {
  it("extrai e normaliza somente um slug válido do domínio configurado", () => {
    expect(extrairSlugTenant("Academia-Centro.APP.SYSBELT.COM.BR", opcoes)).toBe("academia-centro");
  });

  it.each([
    "app.sysbelt.com.br", "www.app.sysbelt.com.br", "academia.evil.example",
    "outra.academia.app.sysbelt.com.br", "-academia.app.sysbelt.com.br",
    "academia-.app.sysbelt.com.br", "academia_app.app.sysbelt.com.br",
    "academia.app.sysbelt.com.br.", "academia.app.sysbelt.com.br:443",
  ])("rejeita host inválido ou reservado: %s", (host) => {
    expect(() => extrairSlugTenant(host, opcoes)).toThrow("HOST_TENANT_INVALIDO");
  });

  it("remove porta somente quando desenvolvimento foi explicitamente habilitado", () => {
    expect(extrairSlugTenant("academia.localhost:3333", { dominioBase: "localhost", desenvolvimento: true })).toBe("academia");
    expect(() => extrairSlugTenant("academia.localhost:3333", { dominioBase: "localhost" })).toThrow();
  });
});
