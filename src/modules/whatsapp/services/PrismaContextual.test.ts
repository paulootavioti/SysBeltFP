import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return { findUnique, prismaDaRequisicao: vi.fn(() => ({ aluno: { findUnique } })) };
});
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { destinatarioDoAluno } from "../utils/destinatario";

describe("WhatsApp com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(destinatarioDoAluno(1)).resolves.toBeNull();
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
