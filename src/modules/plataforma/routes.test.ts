import { describe, expect, it } from "vitest";

function caminhos(router: { stack: Array<{ route?: { path: string } }> }) {
  return router.stack.flatMap((camada) => camada.route ? [camada.route.path] : []);
}

describe("rotas da plataforma no Tenant Plane", () => {
  it("expõe por padrão somente a assinatura da própria academia", async () => {
    const { plataformaRoutes } = await import("./routes");
    expect(caminhos(plataformaRoutes as never)).toEqual(["/minha-assinatura"]);
  });
});
