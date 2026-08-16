import { describe, expect, it, vi } from "vitest";

const { count, prismaDaRequisicao } = vi.hoisted(() => {
  const count = vi.fn();
  return { count, prismaDaRequisicao: vi.fn(() => ({ aluno: { count } })) };
});
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { ContarAlunosDaContaService } from "./ContarAlunosDaContaService";

describe("contagens da plataforma com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    count.mockResolvedValue(0);
    await expect(new ContarAlunosDaContaService().execute(1)).resolves.toBe(0);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
