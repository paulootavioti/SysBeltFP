import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetGradeSemanalService } from "./GetGradeSemanalService";
import { calcularSemana } from "../utils/semana";

const service = new GetGradeSemanalService();

// quarta-feira fixa, meio-dia — deixa "passado"/"futuro" determinísticos
const AGORA_FIXO = new Date("2026-07-22T12:00:00");

async function limpar() {
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: "TESTE_GRADE_TURMA" } } });
  await prisma.aula.deleteMany({ where: { turma: { nome: "TESTE_GRADE_TURMA" } } });
  await prisma.turma.deleteMany({ where: { nome: "TESTE_GRADE_TURMA" } });
  await prisma.usuario.deleteMany({ where: { nome: "TESTE_GRADE_PROFESSOR" } });
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA_FIXO);
  await limpar();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(limpar);

describe("GetGradeSemanalService", () => {
  it("lista programações da semana com o status de exibição correto", async () => {
    const { inicio } = calcularSemana(AGORA_FIXO);

    const professor = await prisma.usuario.create({
      data: {
        nome: "TESTE_GRADE_PROFESSOR",
        apelido: "Sensei Teste",
        email: `sensei-grade-${Date.now()}@teste.com`,
        senha: "hash",
        perfil: "PROFESSOR",
      },
    });

    const turma = await prisma.turma.create({
      data: {
        nome: "TESTE_GRADE_TURMA",
        faixaEtaria: "Adulto",
        diasSemana: "Segunda",
        horarioInicio: "08:00",
        horarioFim: "09:00",
        professorId: professor.id,
      },
    });

    // sexta-feira desta semana, pendente -> AGENDADA (ainda não chegou)
    const diaFuturo = new Date(inicio);
    diaFuturo.setDate(inicio.getDate() + 4);
    await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: diaFuturo, status: "PENDENTE" },
    });

    // segunda-feira desta semana, pendente -> NAO_REALIZADA (já passou)
    const diaPassado = new Date(inicio);
    await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: diaPassado, status: "PENDENTE" },
    });

    // terça-feira desta semana, iniciada e finalizada -> CONCLUIDA
    const diaConcluido = new Date(inicio);
    diaConcluido.setDate(inicio.getDate() + 1);
    const aulaFinalizada = await prisma.aula.create({
      data: { turmaId: turma.id, data: diaConcluido, status: "FINALIZADA" },
    });
    await prisma.aulaProgramada.create({
      data: {
        turmaId: turma.id,
        data: diaConcluido,
        status: "INICIADA",
        aulaId: aulaFinalizada.id,
      },
    });

    // fora da semana -> não deve aparecer
    const foraDaSemana = new Date(inicio);
    foraDaSemana.setDate(inicio.getDate() - 10);
    await prisma.aulaProgramada.create({
      data: { turmaId: turma.id, data: foraDaSemana, status: "PENDENTE" },
    });

    const grade = await service.execute(AGORA_FIXO);

    expect(grade).toHaveLength(3);
    expect(grade.every((item) => item.turmaNome === "TESTE_GRADE_TURMA")).toBe(true);
    expect(grade.every((item) => item.professorApelido === "Sensei Teste")).toBe(true);

    const statuses = grade.map((item) => item.status).sort();
    expect(statuses).toEqual(["AGENDADA", "CONCLUIDA", "NAO_REALIZADA"]);
  });
});
