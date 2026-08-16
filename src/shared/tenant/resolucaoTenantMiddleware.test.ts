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

  it("bloqueia schema incompatível antes de acessar segredo ou banco", async () => {
    const dependencias = { ...deps(), versoesSchemaCompativeis: new Set(["schema-2"]) };
    const res = resposta();
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.app.sysbelt.com.br" } as never, res as never, vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(503);
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

  it("mantém dois hostnames concorrentes em clientes Prisma distintos", async () => {
    const tenants = {
      alpha: { ...tenant, tenantKey: "11111111-1111-4111-8111-111111111111", slug: "alpha", secretRef: "arn:alpha" },
      beta: { ...tenant, tenantKey: "22222222-2222-4222-8222-222222222222", slug: "beta", secretRef: "arn:beta" },
    };
    const clientes = {
      [tenants.alpha.tenantKey]: { banco: "alpha" },
      [tenants.beta.tenantKey]: { banco: "beta" },
    };
    const diretorio = { resolver: vi.fn(async (slug: "alpha" | "beta") => tenants[slug]) };
    const segredos = { obter: vi.fn(async (ref: string) => ({ pooledUrl: `postgresql://${ref}`, credentialVersion: 2 })) };
    const registro = {
      obter: vi.fn(async ({ tenantKey }: { tenantKey: keyof typeof clientes }, carregar: () => Promise<string>) => {
        await carregar();
        return clientes[tenantKey];
      }),
    };
    const middleware = criarResolucaoTenantMiddleware({
      dominioBase: "app.sysbelt.com.br", diretorio, segredos, registro,
    } as never);
    let entradas = 0;
    let liberar!: () => void;
    const ambasNoContexto = new Promise<void>((resolve) => { liberar = resolve; });
    const observados: Array<{ tenantKey: string; prisma: unknown }> = [];
    const proxima = vi.fn(async () => {
      entradas += 1;
      if (entradas === 2) liberar();
      await ambasNoContexto;
      const contexto = obterContextoTenant();
      observados.push({ tenantKey: contexto.tenantKey, prisma: contexto.prisma });
    });

    await Promise.all([
      middleware({ hostname: "alpha.app.sysbelt.com.br" } as never, resposta() as never, proxima),
      middleware({ hostname: "beta.app.sysbelt.com.br" } as never, resposta() as never, proxima),
    ]);

    expect(observados).toEqual(expect.arrayContaining([
      { tenantKey: tenants.alpha.tenantKey, prisma: clientes[tenants.alpha.tenantKey] },
      { tenantKey: tenants.beta.tenantKey, prisma: clientes[tenants.beta.tenantKey] },
    ]));
    expect(observados[0].prisma).not.toBe(observados[1].prisma);
  });

  it("ignora header de tenant forjado e usa somente o hostname", async () => {
    const dependencias = deps();
    const next = vi.fn(() => expect(obterContextoTenant().slug).toBe("academia"));
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.app.sysbelt.com.br", headers: { "x-tenant": "outra-academia" } } as never,
      resposta() as never,
      next,
    );
    expect(dependencias.diretorio.resolver).toHaveBeenCalledWith("academia");
  });

  it("recusa hostname desconhecido antes de consultar diretório ou banco", async () => {
    const dependencias = deps();
    const res = resposta();
    await criarResolucaoTenantMiddleware(dependencias as never)(
      { hostname: "academia.exemplo.com" } as never, res as never, vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(dependencias.diretorio.resolver).not.toHaveBeenCalled();
    expect(dependencias.registro.obter).not.toHaveBeenCalled();
  });
});
