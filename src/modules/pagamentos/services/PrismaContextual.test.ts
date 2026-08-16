import { describe, expect, it, vi } from "vitest";

const { create, prismaDaRequisicao } = vi.hoisted(() => {
  const create = vi.fn();
  return {
    create,
    prismaDaRequisicao: vi.fn(() => ({
      eventoWebhookPagamento: { create, update: vi.fn() },
    })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ReceberWebhookPagamentoService } from "./ReceberWebhookPagamentoService";

describe("webhook de pagamentos com tenant", () => {
  it("reserva o evento no Prisma associado à requisição", async () => {
    create.mockResolvedValue({ id: 1 });
    const gateway = {
      processarWebhook: vi.fn().mockResolvedValue({
        eventoExternoId: "evt-1", tipo: "payment", situacao: "PENDENTE",
      }),
    };
    await new ReceberWebhookPagamentoService().execute({
      gateway: gateway as never, nomeGateway: "TESTE", payload: {},
    });
    expect(prismaDaRequisicao).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledOnce();
  });
});
