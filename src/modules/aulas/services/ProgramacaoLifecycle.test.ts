import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { UpdateAulaProgramadaService } from "./UpdateAulaProgramadaService";
import { CancelarAulaProgramadaService } from "./CancelarAulaProgramadaService";
import { ReplicarProgramacaoService } from "./ReplicarProgramacaoService";
import { AvisoCancelamentoAulaService } from "../../mensagens/services/AvisoCancelamentoAulaService";

async function limpar() {
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: "TESTE_PROG_TURMA" } } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_PROG_ALUNO" } });
  await prisma.turma.deleteMany({ where: { nome: "TESTE_PROG_TURMA" } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarTurma() {
  return prisma.turma.create({
    data: {
      nome: "TESTE_PROG_TURMA",
      faixaEtaria: "Adulto",
      diasSemana: "Segunda",
      horarioInicio: "08:00",
      horarioFim: "09:00",
    },
  });
}

describe("edição e cancelamento de programação", () => {
  it("edita uma programação pendente", async () => {
    const turma = await criarTurma();
    const programacao = await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: new Date("2026-08-03T08:00:00"), status: "PENDENTE" },
    });

    const service = new UpdateAulaProgramadaService();
    const atualizada = await service.execute(programacao.id, { observacoes: "Levar kimono extra" });

    expect(atualizada.observacoes).toBe("Levar kimono extra");
  });

  it("não permite editar uma programação já cancelada", async () => {
    const turma = await criarTurma();
    const programacao = await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: new Date("2026-08-03T08:00:00"), status: "CANCELADA" },
    });

    const service = new UpdateAulaProgramadaService();
    await expect(service.execute(programacao.id, { observacoes: "x" })).rejects.toThrow();
  });

  it("cancela uma programação pendente e não permite cancelar duas vezes", async () => {
    const turma = await criarTurma();
    const programacao = await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: new Date("2026-08-03T08:00:00"), status: "PENDENTE" },
    });

    const service = new CancelarAulaProgramadaService();
    const cancelada = await service.execute(programacao.id);

    expect(cancelada.status).toBe("CANCELADA");

    await expect(service.execute(programacao.id)).rejects.toThrow();
  });
});

describe("AvisoCancelamentoAulaService", () => {
  it("gera aviso de cancelamento para aluno maior de idade", async () => {
    const turma = await criarTurma();
    await prisma.aluno.create({
      data: {
        nome: "TESTE_PROG_ALUNO",
        dataNascimento: new Date("1995-01-01"),
        turmaId: turma.id,
        ativo: true,
        telefone: "61999998888",
      },
    });

    const service = new AvisoCancelamentoAulaService();
    const avisos = await service.execute(turma.id, new Date("2026-08-03T08:00:00"));

    expect(avisos).toHaveLength(1);
    expect(avisos[0].destinatario).toBe("ALUNO");
    expect(avisos[0].mensagem).toContain("cancelada");
    expect(avisos[0].mensagem).toContain(turma.nome);
  });
});

describe("ReplicarProgramacaoService", () => {
  it("cria uma programação para cada segunda-feira do período e ignora duplicatas", async () => {
    const turma = await criarTurma();

    const service = new ReplicarProgramacaoService();

    // segundas de agosto/2026: 03, 10, 17, 24, 31
    const resultado = await service.execute({
      turmaId: turma.id,
      dataInicio: "2026-08-01",
      dataFim: "2026-08-31",
      diasSemana: [1],
    });

    expect(resultado.criadas).toBe(5);

    const total = await prisma.aulaProgramada.count({ where: { turmaId: turma.id } });
    expect(total).toBe(5);

    // replicar de novo no mesmo período deve ignorar tudo por duplicidade
    await expect(
      service.execute({ turmaId: turma.id, dataInicio: "2026-08-01", dataFim: "2026-08-31", diasSemana: [1] })
    ).rejects.toThrow();
  });

  it("rejeita quando a data final é anterior à inicial", async () => {
    const turma = await criarTurma();
    const service = new ReplicarProgramacaoService();

    await expect(
      service.execute({ turmaId: turma.id, dataInicio: "2026-08-31", dataFim: "2026-08-01", diasSemana: [1] })
    ).rejects.toThrow();
  });
});
