import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetResumoPeriodoService } from "./GetResumoPeriodoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new GetResumoPeriodoService();

// Meio do mês, meio-dia — deixa "vencida"/"pendente ainda não vencida"/
// "período anterior" determinísticos.
const AGORA_FIXO = new Date("2026-07-15T12:00:00");

let unidadeId: number;

async function limpar() {
  await prisma.graduacao.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_RESUMOPERIODO_" } } } });
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_RESUMOPERIODO_" } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: "TESTE_RESUMOPERIODO_UNIDADE" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_RESUMOPERIODO_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_RESUMOPERIODO_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_RESUMOPERIODO_UNIDADE" } });
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

describe("GetResumoPeriodoService", () => {
  it("calcula os KPIs financeiros, de frequência e de matrícula do período (MENSAL)", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_RESUMOPERIODO_UNIDADE");
    unidadeId = unidade.id;

    const alunoA = await prisma.aluno.create({
      data: {
        unidadeId,
        nome: "TESTE_RESUMOPERIODO_ALUNO_A",
        dataNascimento: new Date("2015-01-01"),
        createdAt: AGORA_FIXO,
      },
    });

    await prisma.aluno.create({
      data: {
        unidadeId,
        nome: "TESTE_RESUMOPERIODO_ALUNO_B",
        dataNascimento: new Date("2015-01-01"),
        createdAt: AGORA_FIXO,
      },
    });

    const alunoCancelado = await prisma.aluno.create({
      data: {
        unidadeId,
        nome: "TESTE_RESUMOPERIODO_ALUNO_C",
        dataNascimento: new Date("2015-01-01"),
        createdAt: new Date("2026-06-01"),
      },
    });
    await prisma.aluno.update({
      where: { id: alunoCancelado.id },
      // `@updatedAt` é calculado pelo query engine (processo separado do
      // Node), que não enxerga o `vi.setSystemTime` — por isso, no teste,
      // precisamos passar `updatedAt` explicitamente pra simular a edição
      // dentro do período MENSAL fixado em AGORA_FIXO.
      data: { ativo: false, updatedAt: AGORA_FIXO },
    });

    // paga dentro do período
    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: alunoA.id,
        valor: 200,
        vencimento: new Date("2026-07-10T00:00:00"),
        pago: true,
        dataPagamento: AGORA_FIXO,
      },
    });

    // vencida (não paga, vencimento já passou dentro do período)
    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: alunoA.id,
        valor: 100,
        vencimento: new Date("2026-07-05T00:00:00"),
        pago: false,
      },
    });

    // pendente (não paga, mas ainda não venceu, dentro do período)
    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: alunoA.id,
        valor: 150,
        vencimento: new Date("2026-07-15T18:00:00"),
        pago: false,
      },
    });

    // mensalidade paga no período ANTERIOR (junho), pra variação de receita
    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: alunoA.id,
        valor: 100,
        vencimento: new Date("2026-06-10T00:00:00"),
        pago: true,
        dataPagamento: new Date("2026-06-10T00:00:00"),
      },
    });

    const aula = await prisma.aula.create({
      data: { unidadeId, data: AGORA_FIXO },
    });

    await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: alunoA.id, presente: true } });
    await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: alunoCancelado.id, presente: true } });
    const terceiroAluno = await prisma.aluno.create({
      data: {
        unidadeId,
        nome: "TESTE_RESUMOPERIODO_ALUNO_D",
        dataNascimento: new Date("2015-01-01"),
        createdAt: new Date("2026-06-01"),
      },
    });
    await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: terceiroAluno.id, presente: false } });

    await prisma.graduacao.create({
      data: { unidadeId, alunoId: alunoA.id, faixa: "Amarela", data: AGORA_FIXO },
    });

    const resumo = await service.execute("MENSAL", unidadeId);

    expect(resumo.kpis.novosAlunos).toBe(2);
    expect(resumo.kpis.cancelamentos).toBe(1);
    expect(resumo.kpis.saldoAlunos).toBe(1);
    expect(resumo.kpis.alunosAtivos).toBe(3); // A, B e D (C está inativo)

    expect(resumo.kpis.receita).toBe(200);
    expect(resumo.kpis.receitaPrevista).toBe(450);
    expect(resumo.kpis.receitaPendente).toBe(150);
    expect(resumo.kpis.receitaVencida).toBe(100);
    expect(resumo.kpis.alunosPagantes).toBe(1);
    expect(resumo.kpis.ticketMedio).toBe(200);

    expect(resumo.kpis.mensalidadesGeradas).toBe(3);
    expect(resumo.kpis.mensalidadesPendentes).toBe(1);
    expect(resumo.kpis.mensalidadesVencidas).toBe(1);
    expect(resumo.kpis.taxaInadimplencia).toBeCloseTo((1 / 3) * 100);

    expect(resumo.kpis.presencas).toBe(2);
    expect(resumo.kpis.faltas).toBe(1);
    expect(resumo.kpis.presencasEsperadas).toBe(3);
    expect(resumo.kpis.taxaFrequencia).toBeCloseTo((2 / 3) * 100);

    expect(resumo.kpis.graduacoes).toBe(1);

    // receita foi de 100 (junho) pra 200 (julho) -> +100%
    expect(resumo.kpis.variacaoReceita).toBeCloseTo(100);

    expect(resumo.seriesReceita.reduce((soma, p) => soma + p.recebido, 0)).toBe(200);
    expect(resumo.seriesMatriculas.reduce((soma, p) => soma + p.novasMatriculas, 0)).toBe(2);
    expect(resumo.seriesMatriculas.reduce((soma, p) => soma + p.cancelamentos, 0)).toBe(1);
    expect(resumo.seriesAlunosAtivos[resumo.seriesAlunosAtivos.length - 1].valor).toBe(3);
  });

  it("protege ticketMedio e taxas contra divisão por zero quando não há dados no período", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_RESUMOPERIODO_UNIDADE");
    unidadeId = unidade.id;

    const resumo = await service.execute("MENSAL", unidadeId);

    expect(resumo.kpis.ticketMedio).toBe(0);
    expect(resumo.kpis.taxaFrequencia).toBe(0);
    expect(resumo.kpis.taxaInadimplencia).toBe(0);
    expect(resumo.kpis.variacaoReceita).toBe(0);
  });
});
