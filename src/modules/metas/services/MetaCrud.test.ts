import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateMetaService } from "./CreateMetaService";
import { UpdateMetaService } from "./UpdateMetaService";
import { DeleteMetaService } from "./DeleteMetaService";

const createService = new CreateMetaService();
const updateService = new UpdateMetaService();
const deleteService = new DeleteMetaService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.meta.deleteMany({ where: { nome: { startsWith: "TESTE_METACRUD_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_METACRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_METACRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_METACRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("CreateMetaService", () => {
  it("cria a meta vinculada à unidade informada", async () => {
    const meta = await createService.execute({
      unidadeId: unidadeAId,
      nome: "TESTE_METACRUD_META",
      tipo: "RECEITA",
      valorMeta: 5000,
      formatoValor: "MOEDA",
      dataLimite: "2026-12-31",
    });

    expect(meta.unidadeId).toBe(unidadeAId);
    expect(meta.valorMeta).toBe(5000);
  });
});

describe("UpdateMetaService / DeleteMetaService — isolamento entre unidades", () => {
  it("rejeita atualizar uma meta de outra unidade", async () => {
    const meta = await createService.execute({
      unidadeId: unidadeAId,
      nome: "TESTE_METACRUD_META_ISOLAMENTO",
      tipo: "RECEITA",
      valorMeta: 5000,
      formatoValor: "MOEDA",
      dataLimite: "2026-12-31",
    });

    await expect(
      updateService.execute({
        id: meta.id,
        unidadeIdUsuario: unidadeBId,
        nome: "Tentativa de invasão",
        tipo: "RECEITA",
        valorMeta: 1,
        formatoValor: "MOEDA",
        dataLimite: "2026-12-31",
      })
    ).rejects.toThrow(AppError);
  });

  it("rejeita excluir uma meta de outra unidade, mas permite quando é da mesma unidade", async () => {
    const meta = await createService.execute({
      unidadeId: unidadeAId,
      nome: "TESTE_METACRUD_META_EXCLUSAO",
      tipo: "RECEITA",
      valorMeta: 5000,
      formatoValor: "MOEDA",
      dataLimite: "2026-12-31",
    });

    await expect(deleteService.execute(meta.id, unidadeBId)).rejects.toThrow(AppError);

    await expect(deleteService.execute(meta.id, unidadeAId)).resolves.toBeUndefined();
    expect(await prisma.meta.findUnique({ where: { id: meta.id } })).toBeNull();
  });

  it("SUPERADMIN (unidadeId null) pode atualizar/excluir meta de qualquer unidade", async () => {
    const meta = await createService.execute({
      unidadeId: unidadeAId,
      nome: "TESTE_METACRUD_META_SUPERADMIN",
      tipo: "RECEITA",
      valorMeta: 5000,
      formatoValor: "MOEDA",
      dataLimite: "2026-12-31",
    });

    const atualizada = await updateService.execute({
      id: meta.id,
      unidadeIdUsuario: null,
      nome: "TESTE_METACRUD_META_SUPERADMIN_EDITADA",
      tipo: "RECEITA",
      valorMeta: 6000,
      formatoValor: "MOEDA",
      dataLimite: "2026-12-31",
    });

    expect(atualizada.nome).toBe("TESTE_METACRUD_META_SUPERADMIN_EDITADA");
  });
});
