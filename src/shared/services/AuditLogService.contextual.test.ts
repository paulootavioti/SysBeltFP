import { describe, expect, it, vi } from "vitest";

const { create, prismaDaRequisicao } = vi.hoisted(() => {
  const create = vi.fn();
  return { create, prismaDaRequisicao: vi.fn(() => ({ auditLog: { create } })) };
});

vi.mock("../database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { AuditLogService } from "./AuditLogService";

describe("auditoria com tenant", () => {
  it("grava no Prisma associado à requisição", async () => {
    create.mockResolvedValue({ id: 1 });
    await new AuditLogService().registrar({
      unidadeId: 1, entidade: "Consentimento", entidadeId: 1, operacao: "CONSENTIMENTO",
    });
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
  });
});
