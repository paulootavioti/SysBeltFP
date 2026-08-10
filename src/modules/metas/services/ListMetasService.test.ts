import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ListMetasService } from "./ListMetasService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new ListMetasService();

const AGORA_FIXO = new Date("2026-07-15T12:00:00");

let unidadeId: number;

async function limpar() {
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_LISTMETAS_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_LISTMETAS_" } } });
  await prisma.meta.deleteMany({ where: { unidade: { nome: "TESTE_LISTMETAS_UNIDADE" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_LISTMETAS_UNIDADE" } });
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

describe("ListMetasService", () => {
  it("calcula valorAtual e percentual pra uma meta de RECEITA (quanto maior, melhor)", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_LISTMETAS_UNIDADE");
    unidadeId = unidade.id;

    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_LISTMETAS_ALUNO", dataNascimento: new Date("2015-01-01") },
    });

    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: aluno.id,
        valor: 500,
        vencimento: new Date("2026-07-10"),
        pago: true,
        dataPagamento: AGORA_FIXO,
      },
    });

    await prisma.meta.create({
      data: {
        unidadeId,
        nome: "TESTE_LISTMETAS_META_RECEITA",
        tipo: "RECEITA",
        valorMeta: 1000,
        formatoValor: "MOEDA",
        dataLimite: new Date("2026-08-31"),
      },
    });

    const metas = await service.execute(unidadeId);
    const meta = metas.find((m) => m.nome === "TESTE_LISTMETAS_META_RECEITA");

    expect(meta?.valorAtual).toBe(500);
    expect(meta?.percentualAtingido).toBeCloseTo(50);
    expect(meta?.status).toBe("EM_ANDAMENTO");
  });

  it("inverte o percentual pra uma meta de INADIMPLENCIA (quanto menor, melhor) e marca ATINGIDA quando já está abaixo do teto", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_LISTMETAS_UNIDADE");
    unidadeId = unidade.id;

    // sem mensalidades no período -> taxaInadimplencia = 0
    await prisma.meta.create({
      data: {
        unidadeId,
        nome: "TESTE_LISTMETAS_META_INADIMPLENCIA",
        tipo: "INADIMPLENCIA",
        valorMeta: 20,
        formatoValor: "PERCENTUAL",
        dataLimite: new Date("2026-08-31"),
      },
    });

    const metas = await service.execute(unidadeId);
    const meta = metas.find((m) => m.nome === "TESTE_LISTMETAS_META_INADIMPLENCIA");

    // valorAtual = 0 (sem inadimplência) -> percentual = valorMeta / max(valorAtual, epsilon) * 100 -> altíssimo -> ATINGIDA
    expect(meta?.valorAtual).toBe(0);
    expect(meta?.status).toBe("ATINGIDA");
  });

  it("marca ATRASADA quando o prazo já passou e a meta não foi atingida", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_LISTMETAS_UNIDADE");
    unidadeId = unidade.id;

    await prisma.meta.create({
      data: {
        unidadeId,
        nome: "TESTE_LISTMETAS_META_ATRASADA",
        tipo: "RECEITA",
        valorMeta: 10000,
        formatoValor: "MOEDA",
        dataLimite: new Date("2026-06-01"), // já passou em relação a AGORA_FIXO (15/07)
      },
    });

    const metas = await service.execute(unidadeId);
    const meta = metas.find((m) => m.nome === "TESTE_LISTMETAS_META_ATRASADA");

    expect(meta?.status).toBe("ATRASADA");
  });

  it("SUPERADMIN (unidadeId null) vê metas de todas as unidades", async () => {
    const unidade = await criarUnidadeDeTeste("TESTE_LISTMETAS_UNIDADE");
    unidadeId = unidade.id;

    await prisma.meta.create({
      data: {
        unidadeId,
        nome: "TESTE_LISTMETAS_META_SUPERADMIN",
        tipo: "ALUNOS_ATIVOS",
        valorMeta: 50,
        formatoValor: "QUANTIDADE",
        dataLimite: new Date("2026-08-31"),
      },
    });

    const metas = await service.execute(null);
    expect(metas.some((m) => m.nome === "TESTE_LISTMETAS_META_SUPERADMIN")).toBe(true);
  });
});
