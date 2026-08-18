import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { comContextoRequisicao } from "../../../shared/context/contextoRequisicao";
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
  const filialAlfa = await prisma.unidade.create({
    data: { contaId: alfa.id, nome: `${PREFIXO}Alfa Filial` },
  });
  await prisma.unidade.create({ data: { contaId: beta.id, nome: `${PREFIXO}Beta Matriz` } });

  return { matrizAlfa, filialAlfa };
}

/** Um DONO da Alfa: sem unidade ativa, alcançando as duas unidades dela. */
const comoDonoDaAlfa = <T>(unidades: number[], acao: () => Promise<T>) =>
  comContextoRequisicao({ usuarioId: 1, unidadesDoUsuario: unidades }, acao);

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

  // O DONO não tem unidade ativa (RN-164) e é aqui que ele alterna entre as
  // filiais (RN-165) — a lista precisa vir cheia. Mas cheia da conta DELE:
  // um banco pode conter mais de um assinante, e "sem unidade ativa" já
  // significou "sem filtro", o que entregava o vizinho.
  it("DONO sem unidade ativa vê as filiais da própria conta", async () => {
    const { matrizAlfa, filialAlfa } = await cenarioComDoisAssinantes();

    const nomes = await comoDonoDaAlfa([matrizAlfa.id, filialAlfa.id], async () =>
      (await service.execute(null)).map((o) => o.nome)
    );

    expect(nomes).toContain(`${PREFIXO}Alfa Matriz`);
    expect(nomes).toContain(`${PREFIXO}Alfa Filial`);
    expect(nomes).not.toContain(`${PREFIXO}Beta Matriz`);
  });

  it("sem alcance nenhum no contexto, não enxerga academia nenhuma", async () => {
    await cenarioComDoisAssinantes();

    expect(await comoDonoDaAlfa([], () => service.execute(null))).toEqual([]);
  });

  it("unidade ativa inexistente não vira acesso a tudo", async () => {
    await cenarioComDoisAssinantes();

    // falha fechado: dado inconsistente devolve lista vazia, não a lista
    // completa de todos os assinantes.
    expect(await service.execute(999999)).toEqual([]);
  });
});
