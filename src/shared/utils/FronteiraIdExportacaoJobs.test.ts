import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../database/prisma";
import { comContextoRequisicao } from "../context/contextoRequisicao";
import { executarPorConta } from "../jobs/executarPorConta";
import { GetEventoService } from "../../modules/eventos/services/GetEventoService";
import { EstornarMensalidadeService } from "../../modules/mensalidades/services/EstornarMensalidadeService";
import { ExportarRelatorioService } from "../../modules/financeiro/services/ExportarRelatorioService";

// Gate "duas contas sem acesso cruzado" (docs/prontidao-lancamento.md):
// leitura e vínculo já têm teste em EscopoEntreContas, EscopoContaUnidade e
// PerfilDonoEFronteira; o webhook, em WebhookMercadoPagoRota. Aqui ficam os
// caminhos que faltavam: busca e escrita por ID, exportação e jobs por conta.

const PREFIXO = "TESTE_FRONTEIRA_IDJOBS_";

async function limpar() {
  const contas = { nome: { startsWith: PREFIXO } };
  const unidades = { conta: contas };
  await prisma.mensalidade.deleteMany({ where: { unidade: unidades } });
  await prisma.evento.deleteMany({ where: { unidade: unidades } });
  await prisma.alunoUnidade.deleteMany({ where: { unidade: unidades } });
  await prisma.aluno.deleteMany({ where: { unidade: unidades } });
  await prisma.unidade.deleteMany({ where: unidades });
  await prisma.conta.deleteMany({ where: contas });
}

beforeEach(limpar);
afterAll(limpar);

async function academia(nome: string, { ativa = true } = {}) {
  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}${nome}`, ativo: ativa } });
  const unidade = await prisma.unidade.create({
    data: { contaId: conta.id, nome: `${PREFIXO}${nome} Matriz` },
  });
  const aluno = await prisma.aluno.create({
    data: { unidadeId: unidade.id, nome: `${PREFIXO}${nome} Aluno`, dataNascimento: new Date("2010-01-01") },
  });
  const evento = await prisma.evento.create({
    data: { unidadeId: unidade.id, titulo: `${PREFIXO}${nome} Evento`, tipo: "OUTRO", dataInicio: new Date() },
  });
  const mensalidadePaga = await prisma.mensalidade.create({
    data: {
      unidadeId: unidade.id,
      alunoId: aluno.id,
      valor: 150,
      valorFinal: 150,
      vencimento: new Date(),
      dataPagamento: new Date(),
      pago: true,
      status: "PAGA",
    },
  });

  return { conta, unidade, aluno, evento, mensalidadePaga };
}

// Usuário preso a uma unidade (Administrador, Recepção, Professor).
const comoEquipe = <T>(acao: () => Promise<T>) =>
  comContextoRequisicao({ usuarioId: 1, unidadesDoUsuario: [] }, acao);

// DONO: sem unidade ativa, alcança as unidades da própria conta (RN-164).
const comoDono = <T>(unidadesDaConta: number[], acao: () => Promise<T>) =>
  comContextoRequisicao({ usuarioId: 1, unidadesDoUsuario: unidadesDaConta }, acao);

describe("busca por ID não atravessa a fronteira entre contas", () => {
  it("equipe da Beta não lê evento da Alfa pelo id", async () => {
    const alfa = await academia("Alfa");
    const beta = await academia("Beta");

    await expect(
      comoEquipe(() => new GetEventoService().execute(alfa.evento.id, beta.unidade.id))
    ).rejects.toThrow("Evento não encontrado.");
  });

  it("DONO da Beta também não lê evento da Alfa pelo id", async () => {
    const alfa = await academia("Alfa");
    const beta = await academia("Beta");

    await expect(
      comoDono([beta.unidade.id], () => new GetEventoService().execute(alfa.evento.id, null))
    ).rejects.toThrow("Evento não encontrado.");
  });

  it("mas cada conta lê o próprio evento", async () => {
    const alfa = await academia("Alfa");
    await academia("Beta");

    const evento = await comoDono([alfa.unidade.id], () =>
      new GetEventoService().execute(alfa.evento.id, null)
    );

    expect(evento.id).toBe(alfa.evento.id);
  });
});

describe("escrita por ID não atravessa a fronteira entre contas", () => {
  it("Beta não estorna mensalidade paga da Alfa, e nada muda no banco", async () => {
    const alfa = await academia("Alfa");
    const beta = await academia("Beta");

    await expect(
      comoEquipe(() =>
        new EstornarMensalidadeService().execute(alfa.mensalidadePaga.id, beta.unidade.id, 1, "teste")
      )
    ).rejects.toThrow("Mensalidade não encontrada.");

    await expect(
      comoDono([beta.unidade.id], () =>
        new EstornarMensalidadeService().execute(alfa.mensalidadePaga.id, null, 1, "teste")
      )
    ).rejects.toThrow("Mensalidade não encontrada.");

    const intacta = await prisma.mensalidade.findUniqueOrThrow({ where: { id: alfa.mensalidadePaga.id } });
    expect(intacta.status).toBe("PAGA");
    expect(intacta.estornadoEm).toBeNull();
  });
});

describe("exportação não leva dados de outra conta", () => {
  it("CSV de contas pagas do DONO da Alfa só tem alunos da Alfa", async () => {
    const alfa = await academia("Alfa");
    await academia("Beta");

    const csv = await comoDono([alfa.unidade.id], () =>
      new ExportarRelatorioService().execute("PAGAS", null)
    );

    expect(csv).toContain(`${PREFIXO}Alfa Aluno`);
    expect(csv).not.toContain(`${PREFIXO}Beta Aluno`);
  });

  it("CSV da equipe da Beta não tem alunos da Alfa", async () => {
    await academia("Alfa");
    const beta = await academia("Beta");

    const csv = await comoEquipe(() =>
      new ExportarRelatorioService().execute("PAGAS", beta.unidade.id)
    );

    expect(csv).toContain(`${PREFIXO}Beta Aluno`);
    expect(csv).not.toContain(`${PREFIXO}Alfa Aluno`);
  });
});

describe("jobs rodam uma unidade por vez, dentro da conta dela", () => {
  it("cada execução recebe a unidade da própria conta e pula conta inativa", async () => {
    const alfa = await academia("Alfa");
    const beta = await academia("Beta");
    const inativa = await academia("Inativa", { ativa: false });

    const lotes = await executarPorConta(prisma, async (unidadeId) => unidadeId);
    const nossos = lotes.filter((l) =>
      [alfa.conta.id, beta.conta.id, inativa.conta.id].includes(l.contaId)
    );

    expect(nossos).toEqual([
      { contaId: alfa.conta.id, unidades: 1, resultado: alfa.unidade.id },
      { contaId: beta.conta.id, unidades: 1, resultado: beta.unidade.id },
    ]);
  });

  it("falha numa conta não interrompe nem contamina a outra", async () => {
    const alfa = await academia("Alfa");
    const beta = await academia("Beta");

    const lotes = await executarPorConta(prisma, async (unidadeId) => {
      if (unidadeId === alfa.unidade.id) throw new Error("detalhe interno da Alfa");
      return "ok";
    });

    expect(lotes.find((l) => l.contaId === alfa.conta.id)).toEqual({
      contaId: alfa.conta.id,
      unidades: 1,
      erro: "FALHA_NO_LOTE",
    });
    expect(lotes.find((l) => l.contaId === beta.conta.id)).toEqual({
      contaId: beta.conta.id,
      unidades: 1,
      resultado: "ok",
    });
  });
});
