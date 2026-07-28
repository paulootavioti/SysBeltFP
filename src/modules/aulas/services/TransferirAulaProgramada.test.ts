import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateAulaProgramadaService } from "./CreateAulaProgramadaService";
import { TransferirAulaProgramadaService } from "./TransferirAulaProgramadaService";

let unidadeId: number;
let professorTitularId: number;
let professorSubstitutoId: number;

async function limpar() {
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_TRANSF_" } } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_TRANSF_" } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_transf_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_TRANSF_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_TRANSF_UNIDADE" } });
  unidadeId = unidade.id;

  const titular = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_TRANSF_TITULAR",
      email: "teste_transf_titular@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorTitularId = titular.id;

  const substituto = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_TRANSF_SUBSTITUTO",
      email: "teste_transf_substituto@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorSubstitutoId = substituto.id;
});
afterAll(limpar);

async function criarTurma(nome: string, professorId: number, horarioInicio = "18:00", horarioFim = "19:00") {
  return prisma.turma.create({
    data: {
      unidadeId,
      nome,
      faixaEtaria: "Adulto",
      diasSemana: [1],
      horarioInicio,
      horarioFim,
      professorId,
    },
  });
}

describe("TransferirAulaProgramadaService", () => {
  it("transfere a aula pra outro professor com motivo obrigatório", async () => {
    const turma = await criarTurma("TESTE_TRANSF_TURMA", professorTitularId);
    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turma.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    const resultado = await new TransferirAulaProgramadaService().execute(
      programacao.id,
      { professorSubstitutoId, motivo: "Professor titular em atestado médico." },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    expect(resultado.professorSubstitutoId).toBe(professorSubstitutoId);
    expect(resultado.motivoTransferencia).toBe("Professor titular em atestado médico.");
  });

  it("ADMIN pode transferir qualquer aula da unidade", async () => {
    const turma = await criarTurma("TESTE_TRANSF_TURMA", professorTitularId);
    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turma.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    const resultado = await new TransferirAulaProgramadaService().execute(
      programacao.id,
      { professorSubstitutoId, motivo: "Substituição administrativa." },
      { id: 999999, perfil: "ADMIN", unidadeId }
    );

    expect(resultado.professorSubstitutoId).toBe(professorSubstitutoId);
  });

  it("rejeita professor transferindo aula de turma que não é sua", async () => {
    const turma = await criarTurma("TESTE_TRANSF_TURMA", professorTitularId);
    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turma.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    await expect(
      new TransferirAulaProgramadaService().execute(
        programacao.id,
        { professorSubstitutoId, motivo: "Tentativa indevida." },
        { id: professorSubstitutoId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(/próprias turmas/i);
  });

  it("rejeita transferir pro próprio professor titular", async () => {
    const turma = await criarTurma("TESTE_TRANSF_TURMA", professorTitularId);
    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turma.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    await expect(
      new TransferirAulaProgramadaService().execute(
        programacao.id,
        { professorSubstitutoId: professorTitularId, motivo: "Motivo qualquer." },
        { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(/diferente/i);
  });

  it("rejeita transferir programação já iniciada", async () => {
    const turma = await criarTurma("TESTE_TRANSF_TURMA", professorTitularId);
    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turma.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    await prisma.aulaProgramada.update({ where: { id: programacao.id }, data: { status: "INICIADA" } });

    await expect(
      new TransferirAulaProgramadaService().execute(
        programacao.id,
        { professorSubstitutoId, motivo: "Motivo qualquer." },
        { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(/pendente/i);
  });

  it("rejeita quando o substituto já está escalado em outra turma no mesmo horário", async () => {
    const turmaTitular = await criarTurma("TESTE_TRANSF_TURMA_TITULAR", professorTitularId);
    const turmaSubstituto = await criarTurma(
      "TESTE_TRANSF_TURMA_SUBSTITUTO",
      professorSubstitutoId,
      "18:00",
      "19:00"
    );

    const programacao = await new CreateAulaProgramadaService().execute(
      { turmaId: turmaTitular.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    await new CreateAulaProgramadaService().execute(
      { turmaId: turmaSubstituto.id, data: "2026-08-10T18:00:00" },
      unidadeId
    );

    await expect(
      new TransferirAulaProgramadaService().execute(
        programacao.id,
        { professorSubstitutoId, motivo: "Motivo qualquer." },
        { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(/conflito de horário/i);
  });
});
