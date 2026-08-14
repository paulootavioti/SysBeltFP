import { describe, expect, it, vi } from "vitest";
import { criarResolucaoTenantAtivavel } from "./resolucaoTenantAtivavel";

describe("resolução tenant ativável", () => {
  it("mantém o fluxo legado sem criar infraestrutura quando desabilitada", () => {
    const next = vi.fn(); const fabrica = vi.fn();
    criarResolucaoTenantAtivavel({}, fabrica)({} as never, {} as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(fabrica).not.toHaveBeenCalled();
  });

  it("cria uma vez e executa o middleware quando habilitada", () => {
    const interno = vi.fn(); const fabrica = vi.fn().mockReturnValue(interno);
    const middleware = criarResolucaoTenantAtivavel({ TENANT_RESOLUTION_ENABLED: "true" }, fabrica);
    middleware({} as never, {} as never, vi.fn());
    middleware({} as never, {} as never, vi.fn());
    expect(fabrica).toHaveBeenCalledOnce();
    expect(interno).toHaveBeenCalledTimes(2);
  });

  it("recusa modo obrigatório sem middleware habilitado", () => {
    expect(() => criarResolucaoTenantAtivavel({ TENANT_RESOLUTION_REQUIRED: "true" }))
      .toThrow("TENANT_RESOLUTION_REQUIRED exige TENANT_RESOLUTION_ENABLED");
  });
});
