import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateFormaPagamentoService } from "./CreateFormaPagamentoService";
import { UpdateFormaPagamentoService } from "./UpdateFormaPagamentoService";
import { ToggleAtivoFormaPagamentoService } from "./ToggleAtivoFormaPagamentoService";
import { ListFormasPagamentoService } from "./ListFormasPagamentoService";

const createService = new CreateFormaPagamentoService();
const updateService = new UpdateFormaPagamentoService();
const toggleService = new ToggleAtivoFormaPagamentoService();
const listService = new ListFormasPagamentoService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.formaPagamento.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_FORMAPAGCRUD_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_FORMAPAGCRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_FORMAPAGCRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_FORMAPAGCRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("CreateFormaPagamentoService", () => {
  it("cria a forma de pagamento vinculada à unidade", async () => {
    const forma = await createService.execute({ unidadeId: unidadeAId, tipo: "PIX" });

    expect(forma.unidadeId).toBe(unidadeAId);
    expect(forma.ativo).toBe(true);
  });

  it("aceita tipo OUTRO com nome personalizado", async () => {
    const forma = await createService.execute({
      unidadeId: unidadeAId,
      tipo: "OUTRO",
      nomePersonalizado: "Vale-treino",
    });

    expect(forma.nomePersonalizado).toBe("Vale-treino");
  });
});

describe("ListFormasPagamentoService — isolamento entre unidades", () => {
  it("só lista as formas de pagamento da própria unidade", async () => {
    await createService.execute({ unidadeId: unidadeAId, tipo: "PIX" });
    await createService.execute({ unidadeId: unidadeBId, tipo: "DINHEIRO" });

    const listaA = await listService.execute(unidadeAId);

    expect(listaA).toHaveLength(1);
    expect(listaA[0].tipo).toBe("PIX");
  });
});

describe("UpdateFormaPagamentoService / ToggleAtivoFormaPagamentoService — isolamento", () => {
  it("rejeita atualizar uma forma de pagamento de outra unidade", async () => {
    const forma = await createService.execute({ unidadeId: unidadeAId, tipo: "PIX" });

    await expect(
      updateService.execute(forma.id, { tipo: "DINHEIRO" }, unidadeBId)
    ).rejects.toThrow(AppError);
  });

  it("permite alternar ativo/inativo dentro da mesma unidade", async () => {
    const forma = await createService.execute({ unidadeId: unidadeAId, tipo: "BOLETO" });

    const desativada = await toggleService.execute(forma.id, unidadeAId);
    expect(desativada.ativo).toBe(false);

    const reativada = await toggleService.execute(forma.id, unidadeAId);
    expect(reativada.ativo).toBe(true);
  });

  it("rejeita alternar ativo/inativo de uma forma de pagamento de outra unidade", async () => {
    const forma = await createService.execute({ unidadeId: unidadeAId, tipo: "BOLETO" });

    await expect(toggleService.execute(forma.id, unidadeBId)).rejects.toThrow(AppError);
  });
});
