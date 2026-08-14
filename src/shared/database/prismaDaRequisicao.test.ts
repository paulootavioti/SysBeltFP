import { afterEach, describe, expect, it } from "vitest";
import { comContextoTenant } from "../tenant/ContextoTenant";
import { prismaDaRequisicao } from "./prismaDaRequisicao";

afterEach(() => { delete process.env.TENANT_RESOLUTION_REQUIRED; });

describe("prismaDaRequisicao", () => {
  it("prioriza o cliente exclusivo associado ao contexto", () => {
    const exclusivo = { origem: "tenant" };
    const resultado = comContextoTenant({
      tenantKey: "tenant-a", slug: "academia", prisma: exclusivo as never,
      requestId: "req-1", schemaVersion: "1",
    }, prismaDaRequisicao);
    expect(resultado).toBe(exclusivo);
  });

  it("falha fechado sem contexto quando a resolução é obrigatória", () => {
    process.env.TENANT_RESOLUTION_REQUIRED = "true";
    expect(() => prismaDaRequisicao()).toThrow("CONTEXTO_TENANT_AUSENTE");
  });

  it("preserva temporariamente o cliente legado antes da ativação", () => {
    expect(prismaDaRequisicao()).toBeDefined();
  });
});
