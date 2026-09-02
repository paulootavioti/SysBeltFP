import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ListLeadsService } from "./ListLeadsService";
import { AtualizarStatusLeadService } from "./AtualizarStatusLeadService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const listService = new ListLeadsService();
const atualizarStatusService = new AtualizarStatusLeadService();

let unidadeAId: number;
let unidadeBId: number;
let canalAId: number;
let canalBId: number;

async function limpar() {
  await prisma.lead.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_LEADS_" } } } });
  await prisma.canalCaptacao.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_LEADS_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_LEADS_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await criarUnidadeDeTeste("TESTE_LEADS_UNIDADE_A");
  const unidadeB = await criarUnidadeDeTeste("TESTE_LEADS_UNIDADE_B");
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
  canalAId = (await prisma.canalCaptacao.create({ data: { unidadeId: unidadeAId, nome: "Teste A", slug: `teste-a-${unidadeAId}` } })).id;
  canalBId = (await prisma.canalCaptacao.create({ data: { unidadeId: unidadeBId, nome: "Teste B", slug: `teste-b-${unidadeBId}` } })).id;
});
afterAll(limpar);

describe("ListLeadsService", () => {
  it("lista só leads da própria unidade e filtra por status", async () => {
    await prisma.lead.create({
      data: { unidadeId: unidadeAId, canalId: canalAId, nome: "Lead A1", telefoneE164: "5511999990001" },
    });
    const contactado = await prisma.lead.create({
      data: { unidadeId: unidadeAId, canalId: canalAId, nome: "Lead A2", telefoneE164: "5511999990002", estagio: "CONTATADO" },
    });
    await prisma.lead.create({
      data: { unidadeId: unidadeBId, canalId: canalBId, nome: "Lead B1", telefoneE164: "5511999990003" },
    });

    const leadsA = await listService.execute(unidadeAId);
    expect(leadsA.itens).toHaveLength(2);

    const leadsB = await listService.execute(unidadeBId);
    expect(leadsB.itens).toHaveLength(1);

    const contactados = await listService.execute(unidadeAId, { estagio: "CONTATADO" });
    expect(contactados.itens).toHaveLength(1);
    expect(contactados.itens[0].id).toBe(contactado.id);
  });
});

describe("AtualizarStatusLeadService", () => {
  it("atualiza o status e rejeita acesso de outra unidade", async () => {
    const lead = await prisma.lead.create({
      data: { unidadeId: unidadeAId, canalId: canalAId, nome: "Lead A1", telefoneE164: "5511999990004" },
    });

    await expect(atualizarStatusService.execute(lead.id, "CONTATADO", unidadeBId)).rejects.toThrow(AppError);
    await expect(atualizarStatusService.execute(lead.id, "MATRICULADO", unidadeAId)).rejects.toThrow("Transição de estágio não permitida");

    const atualizado = await atualizarStatusService.execute(lead.id, "CONTATADO", unidadeAId);
    expect(atualizado.estagio).toBe("CONTATADO");
  });
});
