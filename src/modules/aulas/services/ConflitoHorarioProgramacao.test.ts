import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateAulaProgramadaService } from "./CreateAulaProgramadaService";
import { ReplicarProgramacaoService } from "./ReplicarProgramacaoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

let unidadeId: number;
let arenaId: number;

async function limpar() {
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_CONFPROG_" } } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_CONFPROG_" } } });
  await prisma.arena.deleteMany({ where: { nome: "TESTE_CONFPROG_ARENA" } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_CONFPROG_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await criarUnidadeDeTeste("TESTE_CONFPROG_UNIDADE");
  unidadeId = unidade.id;

  const arena = await prisma.arena.create({ data: { unidadeId, nome: "TESTE_CONFPROG_ARENA" } });
  arenaId = arena.id;
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
      arenaId,
    },
  });
}

describe("CreateAulaProgramadaService: conflito de horário", () => {
  it("rejeita programar aula em data/horário já ocupado na mesma arena por outra turma", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "18:30", "19:30", [1]);

    const data = "2026-08-03T18:00:00";

    await new CreateAulaProgramadaService().execute({ turmaId: turmaA.id, data }, unidadeId);

    await expect(
      new CreateAulaProgramadaService().execute({ turmaId: turmaB.id, data }, unidadeId)
    ).rejects.toThrow(/arena/i);
  });

  it("permite programar aula na mesma arena em horário não sobreposto", async () => {
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
  it("rejeita replicação que colide com aula já programada na mesma arena", async () => {
    const turmaA = await criarTurma("TESTE_CONFPROG_TURMA_A", "18:00", "19:00", [1]);
    const turmaB = await criarTurma("TESTE_CONFPROG_TURMA_B", "18:00", "19:00", [1]);

    // com o "Z" explícito o instante é o mesmo em qualquer máquina; sem
    // ele, a string seria lida no fuso do processo e este teste passaria
    // no CI (UTC) e falharia em Brasília.
    await new CreateAulaProgramadaService().execute(
      { turmaId: turmaA.id, data: "2026-08-10T18:00:00Z" },
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
    ).rejects.toThrow(/arena/i);
  });
});
