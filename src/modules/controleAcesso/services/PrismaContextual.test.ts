import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ eventoAcesso: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListEventosAcessoService } from "./ListEventosAcessoService";

describe("controle de acesso com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await expect(new ListEventosAcessoService().execute({ id: 1, perfil: "ADMIN", unidadeId: 1 })).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
