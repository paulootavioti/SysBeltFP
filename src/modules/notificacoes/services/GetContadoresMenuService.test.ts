import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetContadoresMenuService } from "./GetContadoresMenuService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new GetContadoresMenuService();

let unidadeAId: number;
let unidadeBId: number;
let alunoAId: number;

async function limpar() {
  await prisma.mensagemFamilia.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.contrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.modeloContrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.itemPedido.deleteMany({ where: { pedido: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } } });
  await prisma.pedido.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.produtoVariante.deleteMany({ where: { produto: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } } });
  await prisma.produto.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await criarUnidadeDeTeste("TESTE_CONTADORESMENU_UNIDADE_A");
  const unidadeB = await criarUnidadeDeTeste("TESTE_CONTADORESMENU_UNIDADE_B");
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const alunoA = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_CONTADORESMENU_ALUNO_A", dataNascimento: new Date("2000-01-01") },
  });
  alunoAId = alunoA.id;
});
afterAll(limpar);

describe("GetContadoresMenuService", () => {
  it("conta mensalidades vencidas só da própria unidade", async () => {
    await prisma.mensalidade.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        valor: 100,
        vencimento: new Date("2020-01-01"),
        pago: false,
      },
    });
    await prisma.mensalidade.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        valor: 100,
        vencimento: new Date("2999-01-01"),
        pago: false,
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.mensalidadesVencidas).toBe(1);
    expect(contadoresB.mensalidadesVencidas).toBe(0);
  });

  it("conta contratos pendentes de assinatura só da própria unidade", async () => {
    const modelo = await prisma.modeloContrato.create({
      data: { unidadeId: unidadeAId, nome: "TESTE_CONTADORESMENU_MODELO", conteudo: "x" },
    });

    await prisma.contrato.create({
      data: {
        unidadeId: unidadeAId,
        numero: 1,
        alunoId: alunoAId,
        modeloContratoId: modelo.id,
        valor: 100,
        dataInicioVigencia: new Date(),
        conteudoGerado: "x",
        situacao: "PENDENTE_ASSINATURA",
      },
    });
    await prisma.contrato.create({
      data: {
        unidadeId: unidadeAId,
        numero: 2,
        alunoId: alunoAId,
        modeloContratoId: modelo.id,
        valor: 100,
        dataInicioVigencia: new Date(),
        conteudoGerado: "x",
        situacao: "RASCUNHO",
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.contratosAguardandoAssinatura).toBe(1);
    expect(contadoresB.contratosAguardandoAssinatura).toBe(0);
  });

  it("conta graduações pendentes usando a mesma regra de Próximas Promoções", async () => {
    for (let i = 0; i < 8; i++) {
      const aula = await prisma.aula.create({ data: { unidadeId: unidadeAId, data: new Date() } });
      await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: alunoAId, presente: true } });
    }

    const contadoresA = await service.execute(unidadeAId);
    expect(contadoresA.graduacoesPendentes).toBe(1);
  });

  it("conta mensagens da família não lidas, só as enviadas pela família e só da própria unidade", async () => {
    await prisma.mensagemFamilia.create({
      data: { unidadeId: unidadeAId, alunoId: alunoAId, remetenteTipo: "FAMILIA", remetenteNome: "Mãe", texto: "Oi" },
    });
    await prisma.mensagemFamilia.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        remetenteTipo: "FAMILIA",
        remetenteNome: "Mãe",
        texto: "Já lida",
        lida: true,
      },
    });
    await prisma.mensagemFamilia.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        remetenteTipo: "ACADEMIA",
        remetenteNome: "Recepção",
        texto: "Resposta da academia, não conta",
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.mensagensFamiliaNaoLidas).toBe(1);
    expect(contadoresB.mensagensFamiliaNaoLidas).toBe(0);
  });

  it("conta pedidos aguardando retirada só da própria unidade", async () => {
    const produto = await prisma.produto.create({
      data: {
        unidadeId: unidadeAId,
        nome: "TESTE_CONTADORESMENU_PRODUTO",
        categoria: "KIMONO",
        preco: 100,
        variantes: { create: [{ tamanho: "Único", estoque: 5 }] },
      },
      include: { variantes: true },
    });

    await prisma.pedido.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        total: 100,
        itens: { create: [{ varianteId: produto.variantes[0].id, quantidade: 1, precoUnitario: 100 }] },
      },
    });
    await prisma.pedido.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        total: 100,
        status: "ENTREGUE",
        itens: { create: [{ varianteId: produto.variantes[0].id, quantidade: 1, precoUnitario: 100 }] },
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.pedidosAguardandoRetirada).toBe(1);
    expect(contadoresB.pedidosAguardandoRetirada).toBe(0);
  });
});
