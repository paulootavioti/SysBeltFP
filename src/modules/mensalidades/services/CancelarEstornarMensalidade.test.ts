import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateMensalidadeService } from "./CreateMensalidadeService";
import { PagarMensalidadeService } from "./PagarMensalidadeService";
import { CancelarMensalidadeService } from "./CancelarMensalidadeService";
import { EstornarMensalidadeService } from "./EstornarMensalidadeService";

const createService = new CreateMensalidadeService();
const pagarService = new PagarMensalidadeService();
const cancelarService = new CancelarMensalidadeService();
const estornarService = new EstornarMensalidadeService();

let unidadeAId: number;
let unidadeBId: number;
let usuarioId: number;
let alunoId: number;

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { usuario: { email: "teste.vitest.cancelestorno@sysbelt.local" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_CANCELESTORNO_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CANCELESTORNO_" } } });
  await prisma.usuario.deleteMany({ where: { email: "teste.vitest.cancelestorno@sysbelt.local" } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_CANCELESTORNO_" } } });
}

async function criarMensalidade(vencimento: string) {
  return createService.execute({
    alunoId,
    valor: 100,
    vencimento,
    unidadeIdUsuario: unidadeAId,
    usuarioId,
  });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_CANCELESTORNO_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_CANCELESTORNO_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId: unidadeAId,
      nome: "TESTE_CANCELESTORNO_ADMIN",
      email: "teste.vitest.cancelestorno@sysbelt.local",
      senha: "hash-fake",
      perfil: "ADMIN",
    },
  });
  usuarioId = usuario.id;

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidadeAId,
      nome: "TESTE_CANCELESTORNO_ALUNO",
      dataNascimento: new Date("2000-01-01"),
    },
  });
  alunoId = aluno.id;
});
afterAll(limpar);

describe("CancelarMensalidadeService", () => {
  it("cancela uma mensalidade em aberto, registrando motivo e auditoria", async () => {
    const mensalidade = await criarMensalidade("2026-08-10");

    const cancelada = await cancelarService.execute(mensalidade.id, unidadeAId, usuarioId, "Aluno trancou matrícula");

    expect(cancelada.status).toBe("CANCELADA");
    expect(cancelada.motivoCancelamento).toBe("Aluno trancou matrícula");
    expect(cancelada.canceladoEm).not.toBeNull();

    const auditoria = await prisma.auditLog.findFirst({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id, operacao: "CANCELAMENTO" },
    });
    expect(auditoria).not.toBeNull();
  });

  it("rejeita cancelar uma mensalidade já paga", async () => {
    const mensalidade = await criarMensalidade("2026-08-10");
    await pagarService.execute(mensalidade.id, unidadeAId, usuarioId);

    await expect(
      cancelarService.execute(mensalidade.id, unidadeAId, usuarioId, "Tentativa inválida")
    ).rejects.toThrow(AppError);
  });

  it("rejeita cancelar mensalidade de outra unidade", async () => {
    const mensalidade = await criarMensalidade("2026-08-10");

    await expect(
      cancelarService.execute(mensalidade.id, unidadeBId, usuarioId, "Tentativa de invasão")
    ).rejects.toThrow(AppError);
  });
});

describe("EstornarMensalidadeService", () => {
  it("estorna uma mensalidade paga, registrando motivo e auditoria", async () => {
    const mensalidade = await criarMensalidade("2026-08-10");
    await pagarService.execute(mensalidade.id, unidadeAId, usuarioId);

    const estornada = await estornarService.execute(mensalidade.id, unidadeAId, usuarioId, "Pagamento em duplicidade");

    expect(estornada.status).toBe("ESTORNADA");
    expect(estornada.motivoEstorno).toBe("Pagamento em duplicidade");

    const auditoria = await prisma.auditLog.findFirst({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id, operacao: "ESTORNO" },
    });
    expect(auditoria).not.toBeNull();
  });

  it("rejeita estornar uma mensalidade que ainda não foi paga", async () => {
    const mensalidade = await criarMensalidade("2026-08-10");

    await expect(
      estornarService.execute(mensalidade.id, unidadeAId, usuarioId, "Tentativa inválida")
    ).rejects.toThrow(AppError);
  });
});
