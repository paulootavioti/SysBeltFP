import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateModeloContratoService } from "./CreateModeloContratoService";
import { UpdateModeloContratoService } from "./UpdateModeloContratoService";
import { ToggleAtivoModeloContratoService } from "./ToggleAtivoModeloContratoService";
import { VersionarModeloContratoService } from "./VersionarModeloContratoService";
import { ClonarModeloContratoService } from "./ClonarModeloContratoService";

const createService = new CreateModeloContratoService();
const updateService = new UpdateModeloContratoService();
const toggleService = new ToggleAtivoModeloContratoService();
const versionarService = new VersionarModeloContratoService();
const clonarService = new ClonarModeloContratoService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.modeloContrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_MODELOCONTRATOCRUD_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_MODELOCONTRATOCRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_MODELOCONTRATOCRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_MODELOCONTRATOCRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("CreateModeloContratoService / UpdateModeloContratoService", () => {
  it("cria um modelo com versão 1 e ativo por padrão", async () => {
    const modelo = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Contrato Padrão",
      conteudo: "Olá {{nomeAluno}}",
    });

    expect(modelo.versao).toBe(1);
    expect(modelo.ativo).toBe(true);
    expect(modelo.modeloOrigemId).toBeNull();
  });

  it("rejeita editar um modelo de outra unidade", async () => {
    const modelo = await createService.execute({ unidadeId: unidadeAId, nome: "Modelo A", conteudo: "x" });

    await expect(
      updateService.execute(modelo.id, unidadeBId, { nome: "Hackeado", conteudo: "y" })
    ).rejects.toThrow(AppError);
  });
});

describe("ToggleAtivoModeloContratoService", () => {
  it("alterna ativo/inativo", async () => {
    const modelo = await createService.execute({ unidadeId: unidadeAId, nome: "Modelo A", conteudo: "x" });

    const inativado = await toggleService.execute(modelo.id, unidadeAId);
    expect(inativado.ativo).toBe(false);

    const reativado = await toggleService.execute(modelo.id, unidadeAId);
    expect(reativado.ativo).toBe(true);
  });
});

describe("VersionarModeloContratoService", () => {
  it("cria uma nova versão encadeada, preservando a original", async () => {
    const original = await createService.execute({ unidadeId: unidadeAId, nome: "Modelo A", conteudo: "v1" });

    const novaVersao = await versionarService.execute(original.id, unidadeAId);

    expect(novaVersao.versao).toBe(2);
    expect(novaVersao.modeloOrigemId).toBe(original.id);
    expect(novaVersao.id).not.toBe(original.id);

    const originalAindaExiste = await prisma.modeloContrato.findUnique({ where: { id: original.id } });
    expect(originalAindaExiste?.conteudo).toBe("v1");
  });
});

describe("ClonarModeloContratoService", () => {
  it("cria uma cópia independente, sem ligação de versionamento", async () => {
    const original = await createService.execute({ unidadeId: unidadeAId, nome: "Modelo A", conteudo: "conteúdo" });

    const clone = await clonarService.execute(original.id, unidadeAId);

    expect(clone.versao).toBe(1);
    expect(clone.modeloOrigemId).toBeNull();
    expect(clone.nome).toContain("cópia");
    expect(clone.conteudo).toBe("conteúdo");
  });
});
