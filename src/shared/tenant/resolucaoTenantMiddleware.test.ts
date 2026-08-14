import { describe, expect, it, vi } from "vitest";
import { obterContextoTenant } from "./ContextoTenant";
import { criarResolucaoTenantMiddleware } from "./resolucaoTenantMiddleware";
import { TenantDirectoryIndisponivelError } from "./TenantDirectory";

const tenant = {
  tenantKey: "64d729dc-8cbc-4fbf-9259-f28809faf55d", slug: "academia",
  status: "ATIVO" as const, secretRef: "arn:segredo", schemaVersion: "1", credentialVersion: 2,
};

function resposta() {
  const json = vi.fn();
  return { status: vi.fn().mockReturnValue({ json }), json };
}

function deps(status: "ATIVO" | "SUSPENSO" = "ATIVO") {
  const prisma = { tenant: tenant.tenantKey };
  return {
    dominioBase: "app.sysbelt.com.br",
    diretorio: { resolver: vi.fn().mockResolvedValue({ ...tenant, status }) },
    segredos: { obter: vi.fn().mockResolvedValue({ pooledUrl: "postgresql://segredo", credentialVersion: 2 }) },
    registro: { obter: vi.fn().mockImplementation(async (_identidade, carregar) => { await carregar(); return prisma; }) },
  };
}

describe("resolucaoTenantMiddleware", () => {
  it("associa tenant e Prisma exclusivos antes de continuar", async () => {
    const dependencias = deps();
    const next = vi.fn().mockImplementation(() => {
      expect(obterContextoTenant()).toMatchObject({ tenantKey: tenant.tenantKey, slug: "academia", prisma: { tenant: tenant.tenantKey } });
    });
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.app.sysbelt.com.br" } as never, resposta() as never, next,
    );
    expect(next).toHaveBeenCalledOnce();
    expect(dependencias.segredos.obter).toHaveBeenCalledWith("arn:segredo", tenant.tenantKey, 2);
  });

  it("bloqueia ambiente suspenso antes de acessar segredo ou banco", async () => {
    const dependencias = deps("SUSPENSO"); const res = resposta(); const next = vi.fn();
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.app.sysbelt.com.br" } as never, res as never, next,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dependencias.segredos.obter).not.toHaveBeenCalled();
    expect(dependencias.registro.obter).not.toHaveBeenCalled();
  });

  it("falha fechado sem revelar diretório, cofre ou hostname", async () => {
    const dependencias = deps(); const res = resposta();
    dependencias.diretorio.resolver.mockRejectedValue(new TenantDirectoryIndisponivelError());
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.app.sysbelt.com.br" } as never, res as never, vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.status.mock.results[0].value.json).toHaveBeenCalledWith({ mensagem: "Ambiente temporariamente indisponível." });
  });
});
