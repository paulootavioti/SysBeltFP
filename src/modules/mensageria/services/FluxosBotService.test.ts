import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";
import { PASSOS_PADRAO } from "../bot/fluxoBot";
import { FluxosBotService } from "./FluxosBotService";

const SUFIXO = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let unidadeA: number;
let unidadeB: number;

beforeAll(async () => {
  unidadeA = (await criarUnidadeDeTeste(`TESTE_FLUXO_A_${SUFIXO}`)).id;
  unidadeB = (await criarUnidadeDeTeste(`TESTE_FLUXO_B_${SUFIXO}`)).id;
});

afterAll(async () => {
  await prisma.botFluxo.deleteMany({ where: { unidadeId: { in: [unidadeA, unidadeB] } } });
  await prisma.unidade.deleteMany({ where: { id: { in: [unidadeA, unidadeB] } } });
});

describe("configuração versionada do bot", () => {
  it("publica nova versão e preserva a anterior", async () => {
    const service = new FluxosBotService(prisma);
    const inicial = await service.obter(unidadeA);
    const passos = inicial.passos.map((passo) => passo.id === "NOME" ? { ...passo, texto: "Novo texto para o nome" } : passo);
    const publicado = await service.publicar(unidadeA, { nome: inicial.nome, passos });
    expect(publicado.versao).toBe("1.0.1");
    expect(publicado.passos[0].texto).toBe("Novo texto para o nome");
    const versoes = await prisma.botFluxo.findMany({ where: { unidadeId: unidadeA }, orderBy: { versao: "asc" } });
    expect(versoes).toHaveLength(2);
    expect(versoes.map(({ ativo }) => ativo)).toEqual([false, true]);
  });

  it("não lê nem altera o fluxo de outra unidade", async () => {
    const service = new FluxosBotService(prisma);
    const fluxoB = await service.obter(unidadeB);
    expect(fluxoB.versao).toBe("1.0.0");
    expect(fluxoB.passos[0].texto).toBe(PASSOS_PADRAO[0].texto);
  });

  it("rejeita remoção ou mudança estrutural de passos", async () => {
    const service = new FluxosBotService(prisma);
    await expect(service.publicar(unidadeA, { nome: "Inválido", passos: PASSOS_PADRAO.slice(1) })).rejects.toBeInstanceOf(AppError);
    await expect(service.publicar(unidadeA, { nome: "Inválido", passos: PASSOS_PADRAO.map((passo) => passo.id === "NOME" ? { ...passo, tipo: "AUTOMATICO" } : passo) })).rejects.toBeInstanceOf(AppError);
  });
});
