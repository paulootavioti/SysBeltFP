import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetResumoUnidadesService } from "./GetResumoUnidadesService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new GetResumoUnidadesService();

async function limpar() {
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_RESUMOUNIDADES_" } } });
  await prisma.usuario.deleteMany({ where: { nome: { startsWith: "TESTE_RESUMOUNIDADES_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_RESUMOUNIDADES_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_RESUMOUNIDADES_" } } });
}

beforeEach(limpar);
afterAll(limpar);

describe("GetResumoUnidadesService", () => {
  it("SUPERADMIN (unidadeId null) vê todas as unidades", async () => {
    await criarUnidadeDeTeste("TESTE_RESUMOUNIDADES_A");
    await criarUnidadeDeTeste("TESTE_RESUMOUNIDADES_B");

    const resultado = await service.execute(null);
    const nomes = resultado.map((u) => u.nome);

    expect(nomes).toContain("TESTE_RESUMOUNIDADES_A");
    expect(nomes).toContain("TESTE_RESUMOUNIDADES_B");
  });

  it("perfil comum só vê a própria unidade, com os contadores corretos", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_RESUMOUNIDADES_C");
    await criarUnidadeDeTeste("TESTE_RESUMOUNIDADES_D");

    await prisma.aluno.create({
      data: { unidadeId: unidade.id, nome: "TESTE_RESUMOUNIDADES_ALUNO", dataNascimento: new Date("2015-01-01") },
    });

    const professor = await prisma.usuario.create({
      data: {
        unidadeId: unidade.id,
        nome: "TESTE_RESUMOUNIDADES_PROF",
        email: `professor-resumounidades-${Date.now()}@teste.com`,
        senha: "hash",
        perfil: "PROFESSOR",
      },
    });

    await prisma.turma.create({
      data: {
        unidadeId: unidade.id,
        professorId: professor.id,
        nome: "TESTE_RESUMOUNIDADES_TURMA",
        faixaEtaria: "Kids",
        diasSemana: [1, 3],
        horarioInicio: "18:00",
        horarioFim: "19:00",
      },
    });

    const resultado = await service.execute(unidade.id);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe(unidade.id);
    expect(resultado[0].alunosAtivos).toBe(1);
    expect(resultado[0].professores).toBe(1);
    expect(resultado[0].turmasAtivas).toBe(1);
    expect(resultado[0].status).toBe("ATIVA");
  });
});
