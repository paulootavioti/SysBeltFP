import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ unidade: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { GetResumoUnidadesService } from "./GetResumoUnidadesService";

describe("dashboard com tenant", () => {
  it("consulta as unidades no Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await expect(new GetResumoUnidadesService().execute(1)).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
