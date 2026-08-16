import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return { findUnique, prismaDaRequisicao: vi.fn(() => ({ unidade: { findUnique } })) };
});

vi.mock("../database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { contaDaUnidade } from "./contaDoUsuario";

describe("conta do usuário com tenant", () => {
  it("consulta a unidade no Prisma da requisição", async () => {
    findUnique.mockResolvedValue({ contaId: 7 });
    await expect(contaDaUnidade(1)).resolves.toBe(7);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledOnce();
  });
});
