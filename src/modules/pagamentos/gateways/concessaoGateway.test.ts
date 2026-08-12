import { describe, expect, it, vi } from "vitest";

import { obterGatewayConcedido } from ".";

describe("concessão de gateway automático", () => {
  it("mantém pagamento manual sem consultar recurso premium", async () => {
    const temRecurso = vi.fn();
    const gateway = await obterGatewayConcedido("DINHEIRO", null, temRecurso);

    expect(gateway.nome).toBe("Manual");
    expect(temRecurso).not.toHaveBeenCalled();
  });

  it("cai para manual quando há gateway configurado mas sem concessão", async () => {
    const temRecurso = vi.fn().mockResolvedValue(false);
    const gateway = await obterGatewayConcedido(
      "PIX", { gateway: "MERCADO_PAGO" }, temRecurso,
    );

    expect(temRecurso).toHaveBeenCalledWith("GATEWAY_AUTOMATICO");
    expect(gateway.nome).toBe("Manual");
  });

  it("seleciona o gateway externo quando a concessão permite", async () => {
    const temRecurso = vi.fn().mockResolvedValue(true);
    const gateway = await obterGatewayConcedido(
      "PIX", { gateway: "MERCADO_PAGO" }, temRecurso,
    );

    expect(gateway.nome).toBe("Mercado Pago");
  });
});
