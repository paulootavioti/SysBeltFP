import { describe, expect, it } from "vitest";
import { lerConfiguracaoResolucaoTenant } from "./infraTenant";

const base = {
  TENANT_APP_BASE_DOMAIN: "app.sysbelt.com.br",
  CONTROL_PLANE_URL: "https://control.example.com",
  TENANT_DIRECTORY_SECRET: "s".repeat(32),
  TENANT_SCHEMA_COMPATIBLE_VERSIONS: "schema-1,schema-2",
};

describe("configuração da resolução de tenant", () => {
  it("normaliza a configuração e aplica limites defensivos", () => {
    expect(lerConfiguracaoResolucaoTenant(base)).toMatchObject({
      dominioBase: "app.sysbelt.com.br", controlPlaneUrl: "https://control.example.com/",
      ttlDiretorioMs: 30_000, ttlNegativoMs: 5_000, limiteDiretorio: 500,
      limitePrisma: 10, ociosidadePrismaMs: 300_000,
    });
    expect(lerConfiguracaoResolucaoTenant(base).versoesSchemaCompativeis).toEqual(new Set(["schema-1", "schema-2"]));
  });

  it("falha fechado quando domínio, URL ou segredo não estão configurados", () => {
    expect(() => lerConfiguracaoResolucaoTenant({})).toThrow("Resolução de tenant não configurada");
    expect(() => lerConfiguracaoResolucaoTenant({ ...base, TENANT_DIRECTORY_SECRET: "curto" }))
      .toThrow("Resolução de tenant não configurada");
  });

  it("exige HTTPS em produção e rejeita cache fora dos limites", () => {
    expect(() => lerConfiguracaoResolucaoTenant({ ...base, NODE_ENV: "production", CONTROL_PLANE_URL: "http://control.example.com" }))
      .toThrow("HTTPS");
    expect(() => lerConfiguracaoResolucaoTenant({ ...base, TENANT_PRISMA_CACHE_LIMIT: "101" }))
      .toThrow("TENANT_PRISMA_CACHE_LIMIT inválida");
  });
});
