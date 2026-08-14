import { describe, expect, it } from "vitest";
import { comContextoTenant, obterContextoTenant, prismaDoContexto } from "./ContextoTenant";

const pausa = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("ContextoTenant", () => {
  it("falha fechado fora de uma requisição resolvida", () => {
    expect(() => obterContextoTenant()).toThrow("CONTEXTO_TENANT_AUSENTE");
    expect(() => prismaDoContexto()).toThrow("CONTEXTO_TENANT_AUSENTE");
  });

  it("mantém tenants concorrentes isolados durante operações assíncronas", async () => {
    const executar = (tenantKey: string) => comContextoTenant({
      tenantKey, slug: tenantKey, prisma: { tenantKey } as never,
      requestId: `req-${tenantKey}`, schemaVersion: "1",
    }, async () => {
      await pausa();
      return { tenantKey: obterContextoTenant().tenantKey, prisma: prismaDoContexto() };
    });
    const [a, b] = await Promise.all([executar("tenant-a"), executar("tenant-b")]);
    expect(a).toEqual({ tenantKey: "tenant-a", prisma: { tenantKey: "tenant-a" } });
    expect(b).toEqual({ tenantKey: "tenant-b", prisma: { tenantKey: "tenant-b" } });
  });

  it("não permite mutar a identidade já associada", () => {
    comContextoTenant({
      tenantKey: "tenant-a", slug: "academia", prisma: {} as never,
      requestId: "req-1", schemaVersion: "1",
    }, () => expect(Object.isFrozen(obterContextoTenant())).toBe(true));
  });
});
