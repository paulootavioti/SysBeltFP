import { describe, expect, it, vi } from "vitest";
import { TenantDirectoryHttp } from "./TenantDirectory";

const segredo = "s".repeat(32);
const tenant = {
  tenantKey: "64d729dc-8cbc-4fbf-9259-f28809faf55d", slug: "academia-centro",
  status: "ATIVO", secretRef: "arn:segredo", schemaVersion: "2026.08.1", credentialVersion: 2,
};

describe("TenantDirectoryHttp", () => {
  it("autentica e valida a resposta do Control Plane", async () => {
    const requisicao = vi.fn().mockResolvedValue(new Response(JSON.stringify(tenant), { status: 200 }));
    const resultado = await new TenantDirectoryHttp("https://control.example", segredo, requisicao).resolver("academia-centro");
    expect(resultado).toEqual(tenant);
    expect(requisicao.mock.calls[0][0].toString()).toBe("https://control.example/api/diretorio/v1/tenants/academia-centro");
    expect(requisicao.mock.calls[0][1].headers).toMatchObject({ "x-sysbelt-directory-secret": segredo });
  });

  it("traduz tenant ausente sem permitir fallback", async () => {
    const requisicao = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    await expect(new TenantDirectoryHttp("https://control.example", segredo, requisicao).resolver("ausente")).resolves.toBeNull();
  });

  it("falha fechado em indisponibilidade ou contrato adulterado", async () => {
    const erro = vi.fn().mockRejectedValue(new Error("connection string interna"));
    await expect(new TenantDirectoryHttp("https://control.example", segredo, erro).resolver("academia")).rejects.toThrow("TENANT_DIRECTORY_INDISPONIVEL");
    const invalido = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...tenant, pooledUrl: "postgresql://segredo" }), { status: 200 }));
    await expect(new TenantDirectoryHttp("https://control.example", segredo, invalido).resolver("academia")).rejects.toThrow("TENANT_DIRECTORY_INDISPONIVEL");
  });
});
