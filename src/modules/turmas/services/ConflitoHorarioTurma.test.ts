import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateTurmaService } from "./CreateTurmaService";
import { UpdateTurmaService } from "./UpdateTurmaService";

let unidadeId: number;
let professorId: number;
let salaId: number;

async function limpar() {
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_CONF_" } } });
  await prisma.usuario.deleteMany({ where: { nome: "TESTE_CONF_PROFESSOR" } });
  await prisma.sala.deleteMany({ where: { nome: { startsWith: "TESTE_CONF_SALA" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_CONF_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_CONF_UNIDADE" } });
  unidadeId = unidade.id;

  const professor = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_CONF_PROFESSOR",
      email: `professor-conf-${Date.now()}@teste.com`,
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorId = professor.id;

  const sala = await prisma.sala.create({ data: { unidadeId, nome: "TESTE_CONF_SALA" } });
  salaId = sala.id;
});
afterAll(limpar);

async function criarTurmaBase(overrides: Partial<Parameters<CreateTurmaService["execute"]>[0]> = {}) {
  const service = new CreateTurmaService();

  return service.execute({
    unidadeId,
    nome: "TESTE_CONF_TURMA_BASE",
    faixaEtaria: "Adulto",
    diasSemana: [2, 4],
    horarioInicio: "18:00",
    horarioFim: "19:00",
    salaId,
    professorId,
    ...overrides,
  });
}

describe("CreateTurmaService: conflito de horário", () => {
  it("rejeita nova turma na mesma sala, mesmo dia e horário sobreposto", async () => {
    await criarTurmaBase();

    const service = new CreateTurmaService();

    await expect(
      service.execute({
        unidadeId,
        nome: "TESTE_CONF_TURMA_NOVA",
        faixaEtaria: "Adulto",
        diasSemana: [4],
        horarioInicio: "18:30",
        horarioFim: "19:30",
        salaId,
      })
    ).rejects.toThrow(/sala/i);
  });

  it("rejeita nova turma com o mesmo professor, mesmo dia e horário sobreposto (sala diferente)", async () => {
    await criarTurmaBase();

    const outraSala = await prisma.sala.create({ data: { unidadeId, nome: "TESTE_CONF_SALA_2" } });

    const service = new CreateTurmaService();

    await expect(
      service.execute({
        unidadeId,
        nome: "TESTE_CONF_TURMA_NOVA",
        faixaEtaria: "Adulto",
        diasSemana: [2],
        horarioInicio: "18:00",
        horarioFim: "19:00",
        salaId: outraSala.id,
        professorId,
      })
    ).rejects.toThrow(/professor/i);
  });

  it("permite turma na mesma sala em dia diferente", async () => {
    await criarTurmaBase();

    const service = new CreateTurmaService();

    const turma = await service.execute({
      unidadeId,
      nome: "TESTE_CONF_TURMA_NOVA",
      faixaEtaria: "Adulto",
      diasSemana: [3],
      horarioInicio: "18:00",
      horarioFim: "19:00",
      salaId,
    });

    expect(turma.id).toBeDefined();
  });

  it("permite turma na mesma sala e dia com horário não sobreposto", async () => {
    await criarTurmaBase();

    const service = new CreateTurmaService();

    const turma = await service.execute({
      unidadeId,
      nome: "TESTE_CONF_TURMA_NOVA",
      faixaEtaria: "Adulto",
      diasSemana: [2],
      horarioInicio: "19:00",
      horarioFim: "20:00",
      salaId,
    });

    expect(turma.id).toBeDefined();
  });
});

describe("UpdateTurmaService: conflito de horário", () => {
  it("rejeita edição que gera conflito com outra turma existente", async () => {
    const turmaBase = await criarTurmaBase();

    const outraTurma = await prisma.turma.create({
      data: {
        unidadeId,
        nome: "TESTE_CONF_TURMA_OUTRA",
        faixaEtaria: "Adulto",
        diasSemana: [5],
        horarioInicio: "10:00",
        horarioFim: "11:00",
      },
    });

    const service = new UpdateTurmaService();

    await expect(
      service.execute(
        outraTurma.id,
        {
          nome: outraTurma.nome,
          faixaEtaria: outraTurma.faixaEtaria,
          diasSemana: turmaBase.diasSemana,
          horarioInicio: turmaBase.horarioInicio,
          horarioFim: turmaBase.horarioFim,
          salaId,
        },
        unidadeId
      )
    ).rejects.toThrow(/sala/i);
  });

  it("não bloqueia editar a própria turma mantendo o mesmo horário", async () => {
    const turmaBase = await criarTurmaBase();

    const service = new UpdateTurmaService();

    const atualizada = await service.execute(
      turmaBase.id,
      {
        nome: "TESTE_CONF_TURMA_BASE_EDITADA",
        faixaEtaria: turmaBase.faixaEtaria,
        diasSemana: turmaBase.diasSemana,
        horarioInicio: turmaBase.horarioInicio,
        horarioFim: turmaBase.horarioFim,
        salaId,
        professorId,
      },
      unidadeId
    );

    expect(atualizada.nome).toBe("TESTE_CONF_TURMA_BASE_EDITADA");
  });
});
