import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { DeleteModuloCurriculoService } from "./DeleteModuloCurriculoService";
import { DeleteAulaCurriculoService } from "./DeleteAulaCurriculoService";
import { DeleteTecnicaCurriculoService } from "./DeleteTecnicaCurriculoService";

const deleteModuloService = new DeleteModuloCurriculoService();
const deleteAulaService = new DeleteAulaCurriculoService();
const deleteTecnicaService = new DeleteTecnicaCurriculoService();

let unidadeAId: number;
let unidadeBId: number;
let curriculoId: number;

async function limpar() {
  await prisma.tecnicaCurriculo.deleteMany({
    where: { aulaCurriculo: { modulo: { curriculo: { unidade: { nome: { startsWith: "TESTE_DELCURR_" } } } } } },
  });
  await prisma.aula.deleteMany({
    where: { aulaCurriculo: { modulo: { curriculo: { unidade: { nome: { startsWith: "TESTE_DELCURR_" } } } } } },
  });
  await prisma.aulaCurriculo.deleteMany({
    where: { modulo: { curriculo: { unidade: { nome: { startsWith: "TESTE_DELCURR_" } } } } },
  });
  await prisma.moduloCurriculo.deleteMany({
    where: { curriculo: { unidade: { nome: { startsWith: "TESTE_DELCURR_" } } } },
  });
  await prisma.curriculo.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_DELCURR_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_DELCURR_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_DELCURR_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_DELCURR_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const curriculo = await prisma.curriculo.create({
    data: { unidadeId: unidadeAId, nome: "Currículo Teste" },
  });
  curriculoId = curriculo.id;
});
afterAll(limpar);

describe("DeleteTecnicaCurriculoService", () => {
  it("exclui a técnica", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    const tecnica = await prisma.tecnicaCurriculo.create({
      data: { aulaCurriculoId: aula.id, nome: "Armlock" },
    });

    await deleteTecnicaService.execute(tecnica.id, unidadeAId);

    const encontrada = await prisma.tecnicaCurriculo.findUnique({ where: { id: tecnica.id } });
    expect(encontrada).toBeNull();
  });

  it("rejeita excluir técnica de outra unidade", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    const tecnica = await prisma.tecnicaCurriculo.create({
      data: { aulaCurriculoId: aula.id, nome: "Armlock" },
    });

    await expect(deleteTecnicaService.execute(tecnica.id, unidadeBId)).rejects.toThrow(AppError);
  });
});

describe("DeleteAulaCurriculoService", () => {
  it("exclui a aula e suas técnicas em cascata", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    await prisma.tecnicaCurriculo.create({ data: { aulaCurriculoId: aula.id, nome: "Armlock" } });

    await deleteAulaService.execute(aula.id, unidadeAId);

    const aulaEncontrada = await prisma.aulaCurriculo.findUnique({ where: { id: aula.id } });
    const tecnicas = await prisma.tecnicaCurriculo.findMany({ where: { aulaCurriculoId: aula.id } });
    expect(aulaEncontrada).toBeNull();
    expect(tecnicas).toHaveLength(0);
  });

  it("rejeita excluir quando há aula realizada vinculada", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    await prisma.aula.create({
      data: { unidadeId: unidadeAId, data: new Date(), aulaCurriculoId: aula.id },
    });

    await expect(deleteAulaService.execute(aula.id, unidadeAId)).rejects.toThrow(AppError);
  });

  it("rejeita excluir aula de outra unidade", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });

    await expect(deleteAulaService.execute(aula.id, unidadeBId)).rejects.toThrow(AppError);
  });
});

describe("DeleteModuloCurriculoService", () => {
  it("exclui o módulo, aulas e técnicas em cascata", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    await prisma.tecnicaCurriculo.create({ data: { aulaCurriculoId: aula.id, nome: "Armlock" } });

    await deleteModuloService.execute(modulo.id, unidadeAId);

    const moduloEncontrado = await prisma.moduloCurriculo.findUnique({ where: { id: modulo.id } });
    const aulas = await prisma.aulaCurriculo.findMany({ where: { moduloId: modulo.id } });
    expect(moduloEncontrado).toBeNull();
    expect(aulas).toHaveLength(0);
  });

  it("rejeita excluir quando há aula realizada vinculada a uma das aulas do módulo", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });
    const aula = await prisma.aulaCurriculo.create({ data: { moduloId: modulo.id, titulo: "Aula 1" } });
    await prisma.aula.create({
      data: { unidadeId: unidadeAId, data: new Date(), aulaCurriculoId: aula.id },
    });

    await expect(deleteModuloService.execute(modulo.id, unidadeAId)).rejects.toThrow(AppError);
  });

  it("rejeita excluir módulo de outra unidade", async () => {
    const modulo = await prisma.moduloCurriculo.create({ data: { curriculoId, nome: "Módulo 1" } });

    await expect(deleteModuloService.execute(modulo.id, unidadeBId)).rejects.toThrow(AppError);
  });
});
