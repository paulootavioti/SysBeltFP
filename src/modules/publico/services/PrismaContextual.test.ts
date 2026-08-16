import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ modalidade: { findMany } })) };
});
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { GetModalidadesPublicoService } from "./GetModalidadesPublicoService";

describe("conteúdo público com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    process.env.UNIDADE_PUBLICA_ID = "1";
    findMany.mockResolvedValue([]);
    await expect(new GetModalidadesPublicoService().execute()).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
