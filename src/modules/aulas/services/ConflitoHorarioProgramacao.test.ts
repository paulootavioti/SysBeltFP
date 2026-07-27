import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateAulaProgramadaService } from "./CreateAulaProgramadaService";
import { ReplicarProgramacaoService } from "./ReplicarProgramacaoService";

let unidadeId: number;
let salaId: number;

async function limpar() {
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_CONFPROG_" } } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_CONFPROG_" } } });
  await prisma.sala.deleteMany({ where: { nome: "TESTE_CONFPROG_SALA" } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_CONFPROG_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_CONFPROG_UNIDADE" } });
  unidadeId = unidade.id;

  const sala = await prisma.sala.create({ data: { unidadeId, nome: "TESTE_CONFPROG_SALA" } });
  salaId = sala.id;
});
afterAll(limpar);

async function criarTurma(nome: string, horarioInicio: string, horarioFim: string, diasSemana: number[]) {
  return prisma.turma.create({
    data: {
      unidadeId,
      nome,
      faixaEtaria: "Adulto",
      diasSemana,
      horarioInicio,
      horarioFim,
      salaId,
    },
  });
}

describe("CreateAulaProgramadaService: conflito de horário", () => {
  it("rejeita programar aula em data/horário já ocupado na mesma sala por outra turma", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "18:30", "19:30", [1]);

    const data = "2026-08-03T18:00:00";

    await new CreateAulaProgramadaService().execute({ turmaId: turmaA.id, data }, unidadeId);

    await expect(
      new CreateAulaProgramadaService().execute({ turmaId: turmaB.id, data }, unidadeId)
    ).rejects.toThrow(/sala/i);
  });

  it("permite programar aula na mesma sala em horário não sobreposto", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "19:00", "20:00", [1]);

    const data = "2026-08-03T18:00:00";

    await new CreateAulaProgramadaService().execute({ turmaId: turmaA.id, data }, unidadeId);

    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turmaB.id, data },
      unidadeId
    );

    expect(programacao.id).toBeDefined();
  });

  it("não considera conflito com programação cancelada", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "18:00", "19:00", [1]);

    const data = "2026-08-03T18:00:00";

    const programacaoA = await new CreateAulaProgramadaService().execute(
      { turmaId: turmaA.id, data },
      unidadeId
    );

    await prisma.aulaProgramada.update({
      where: { id: programacaoA.id },
      data: { status: "CANCELADA" },
    });

    const programacaoB = await new CreateAulaProgramadaService().execute(
      { turmaId: turmaB.id, data },
      unidadeId
    );

    expect(programacaoB.id).toBeDefined();
  });
});

describe("ReplicarProgramacaoService: conflito de horário", () => {
  it("rejeita replicação que colide com aula já programada na mesma sala", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "18:00", "19:00", [1]);

    await new CreateAulaProgramadaService().execute(
      { turmaId: turmaA.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    const service = new ReplicarProgramacaoService();

    await expect(
      service.execute(
        {
          turmaId: turmaB.id,
          dataInicio: "2026-08-01",
          dataFim: "2026-08-31",
          diasSemana: [1],
        },
        unidadeId
      )
    ).rejects.toThrow(/sala/i);
  });
});
