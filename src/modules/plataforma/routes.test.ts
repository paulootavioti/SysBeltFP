import { afterEach, describe, expect, it, vi } from "vitest";

function caminhos(router: { stack: Array<{ route?: { path: string } }> }) {
  return router.stack.flatMap((camada) => camada.route ? [camada.route.path] : []);
}

afterEach(() => {
  delete process.env.LEGACY_PLATFORM_ADMIN_ENABLED;
  vi.resetModules();
});

describe("rotas da plataforma no Tenant Plane", () => {
  it("expõe por padrão somente a assinatura da própria academia", async () => {
    const { plataformaRoutes } = await import("./routes");
    expect(caminhos(plataformaRoutes as never)).toEqual(["/minha-assinatura"]);
  });

  it("restaura rotas administrativas somente no rollback explícito", async () => {
    process.env.LEGACY_PLATFORM_ADMIN_ENABLED = "true";
    const { plataformaRoutes } = await import("./routes");
    expect(caminhos(plataformaRoutes as never)).toEqual(expect.arrayContaining([
      "/minha-assinatura", "/planos", "/contas", "/faturas/fechamento/cron",
    ]));
  });
});
