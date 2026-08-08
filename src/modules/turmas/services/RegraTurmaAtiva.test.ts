import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateAlunoService } from "../../alunos/services/CreateAlunoService";
import { UpdateAlunoService } from "../../alunos/services/UpdateAlunoService";
import { VincularAlunoTurmaService } from "./VincularAlunoTurmaService";
import { ToggleTurmaAtivoService } from "./ToggleTurmaAtivoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

let unidadeId: number;

async function limpar() {
  // criar aluno agora gera consentimento e auditoria — ambos
  // apontam pra unidade e precisam sair antes dela.
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_RN020_" } } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_RN020_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_RN020_" } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_RN020_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_RN020_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await criarUnidadeDeTeste("TESTE_RN020_UNIDADE");
  unidadeId = unidade.id;
});
afterAll(limpar);

async function criarTurmaInativa() {
  const turma = await prisma.turma.create({
    data: {
      unidadeId,
      nome: "TESTE_RN020_TURMA",
      faixaEtaria: "Adulto",
      diasSemana: [1],
      horarioInicio: "08:00",
      horarioFim: "09:00",
    },
  });

  await new ToggleTurmaAtivoService().execute(turma.id, unidadeId);

  return turma;
}

describe("RN-020: aluno só pode ser vinculado a turma ativa", () => {
  it("rejeita cadastrar aluno já vinculado a uma turma inativa", async () => {
    const turmaInativa = await criarTurmaInativa();

    const service = new CreateAlunoService();

    await expect(
      service.execute({
        unidadeId,
        nome: "TESTE_RN020_ALUNO",
        dataNascimento: "2000-01-01",
        turmaId: turmaInativa.id,
      })
    ).rejects.toThrow("turma inativa");
  });

  it("permite cadastrar aluno sem turma", async () => {
    const service = new CreateAlunoService();

    const aluno = await service.execute({
      unidadeId,
      nome: "TESTE_RN020_ALUNO",
      dataNascimento: "2000-01-01",
      turmaId: null,
    });

    expect(aluno.turmaId).toBeNull();

    await prisma.aluno.delete({ where: { id: aluno.id } });
  });

  it("rejeita mover um aluno existente para uma turma inativa", async () => {
    const turmaInativa = await criarTurmaInativa();

    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_RN020_ALUNO", dataNascimento: new Date("2000-01-01") },
    });

    const service = new UpdateAlunoService();

    await expect(
      service.execute(
        {
          id: aluno.id,
          nome: aluno.nome,
          dataNascimento: "2000-01-01",
          turmaId: turmaInativa.id,
        },
        unidadeId
      )
    ).rejects.toThrow("turma inativa");
  });

  it("não bloqueia editar um aluno mantendo a mesma turma (mesmo que ela já esteja inativa)", async () => {
    const turmaInativa = await criarTurmaInativa();

    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_RN020_ALUNO", dataNascimento: new Date("2000-01-01"), turmaId: turmaInativa.id },
    });

    const service = new UpdateAlunoService();

    const atualizado = await service.execute(
      {
        id: aluno.id,
        nome: "TESTE_RN020_ALUNO_EDITADO",
        dataNascimento: "2000-01-01",
        turmaId: turmaInativa.id,
      },
      unidadeId
    );

    expect(atualizado.nome).toBe("TESTE_RN020_ALUNO_EDITADO");
    expect(atualizado.turmaId).toBe(turmaInativa.id);
  });

  it("rejeita vincular aluno a turma inativa pela tela de turma", async () => {
    const turmaInativa = await criarTurmaInativa();

    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_RN020_ALUNO", dataNascimento: new Date("2000-01-01") },
    });

    const service = new VincularAlunoTurmaService();

    await expect(service.execute(turmaInativa.id, aluno.id, unidadeId)).rejects.toThrow("turma inativa");
  });
});

describe("RN-022: inativar turma não desvincula os alunos", () => {
  it("mantém o aluno vinculado após a turma ser inativada", async () => {
    const turma = await prisma.turma.create({
      data: {
        unidadeId,
        nome: "TESTE_RN020_TURMA",
        faixaEtaria: "Adulto",
        diasSemana: [1],
        horarioInicio: "08:00",
        horarioFim: "09:00",
      },
    });

    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_RN020_ALUNO", dataNascimento: new Date("2000-01-01"), turmaId: turma.id },
    });

    await new ToggleTurmaAtivoService().execute(turma.id, unidadeId);

    const alunoAtualizado = await prisma.aluno.findUnique({ where: { id: aluno.id } });

    expect(alunoAtualizado?.turmaId).toBe(turma.id);
    expect(alunoAtualizado?.ativo).toBe(true);
  });
});
