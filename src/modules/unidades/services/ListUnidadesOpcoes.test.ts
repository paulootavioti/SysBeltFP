import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ListUnidadesOpcoesService } from "./ListUnidadesOpcoesService";

const PREFIXO = "TESTE_OPCOES_";

const service = new ListUnidadesOpcoesService();

async function limpar() {
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function cenarioComDoisAssinantes() {
  const alfa = await prisma.conta.create({ data: { nome: `${PREFIXO}Alfa` } });
  const beta = await prisma.conta.create({ data: { nome: `${PREFIXO}Beta` } });

  const matrizAlfa = await prisma.unidade.create({
    data: { contaId: alfa.id, nome: `${PREFIXO}Alfa Matriz` },
  });
  await prisma.unidade.create({ data: { contaId: alfa.id, nome: `${PREFIXO}Alfa Filial` } });
  await prisma.unidade.create({ data: { contaId: beta.id, nome: `${PREFIXO}Beta Matriz` } });

  return { matrizAlfa };
}

describe("seletor de unidades", () => {
  it("mostra as filiais da própria academia", async () => {
    const { matrizAlfa } = await cenarioComDoisAssinantes();

    const opcoes = await service.execute(matrizAlfa.id);
    const nomes = opcoes.map((o) => o.nome);

    expect(nomes).toContain(`${PREFIXO}Alfa Matriz`);
    expect(nomes).toContain(`${PREFIXO}Alfa Filial`);
  });

  it("não deixa um assinante enxergar as unidades do outro", async () => {
    const { matrizAlfa } = await cenarioComDoisAssinantes();

    const opcoes = await service.execute(matrizAlfa.id);
    const nomes = opcoes.map((o) => o.nome);

    expect(nomes).not.toContain(`${PREFIXO}Beta Matriz`);
  });

  it("esconde unidade desativada", async () => {
    const { matrizAlfa } = await cenarioComDoisAssinantes();

    await prisma.unidade.updateMany({
      where: { nome: `${PREFIXO}Alfa Filial` },
      data: { ativo: false },
    });

    const nomes = (await service.execute(matrizAlfa.id)).map((o) => o.nome);

    expect(nomes).not.toContain(`${PREFIXO}Alfa Filial`);
  });

  it("operador do SaaS (sem unidade ativa) enxerga todas", async () => {
    await cenarioComDoisAssinantes();

    const nomes = (await service.execute(null)).map((o) => o.nome);

    expect(nomes).toContain(`${PREFIXO}Alfa Matriz`);
    expect(nomes).toContain(`${PREFIXO}Beta Matriz`);
  });

  it("unidade ativa inexistente não vira acesso a tudo", async () => {
    await cenarioComDoisAssinantes();

    // falha fechado: dado inconsistente devolve lista vazia, não a lista
    // completa de todos os assinantes.
    expect(await service.execute(999999)).toEqual([]);
  });
});
