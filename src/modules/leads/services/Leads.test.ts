import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ListLeadsService } from "./ListLeadsService";
import { AtualizarStatusLeadService } from "./AtualizarStatusLeadService";

const listService = new ListLeadsService();
const atualizarStatusService = new AtualizarStatusLeadService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.lead.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_LEADS_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_LEADS_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_LEADS_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_LEADS_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("ListLeadsService", () => {
  it("lista só leads da própria unidade e filtra por status", async () => {
    await prisma.lead.create({
      data: { unidadeId: unidadeAId, nome: "Lead A1", contato: "111", interesse: "Jiu-Jitsu Kids" },
    });
    const contactado = await prisma.lead.create({
      data: { unidadeId: unidadeAId, nome: "Lead A2", contato: "222", interesse: "Grappling", status: "CONTACTADO" },
    });
    await prisma.lead.create({
      data: { unidadeId: unidadeBId, nome: "Lead B1", contato: "333", interesse: "Autodefesa" },
    });

    const leadsA = await listService.execute(unidadeAId);
    expect(leadsA).toHaveLength(2);

    const leadsB = await listService.execute(unidadeBId);
    expect(leadsB).toHaveLength(1);

    const contactados = await listService.execute(unidadeAId, { status: "CONTACTADO" });
    expect(contactados).toHaveLength(1);
    expect(contactados[0].id).toBe(contactado.id);
  });
});

describe("AtualizarStatusLeadService", () => {
  it("atualiza o status e rejeita acesso de outra unidade", async () => {
    const lead = await prisma.lead.create({
      data: { unidadeId: unidadeAId, nome: "Lead A1", contato: "111", interesse: "Jiu-Jitsu Adulto" },
    });

    await expect(atualizarStatusService.execute(lead.id, "CONVERTIDO", unidadeBId)).rejects.toThrow(AppError);

    const atualizado = await atualizarStatusService.execute(lead.id, "CONVERTIDO", unidadeAId);
    expect(atualizado.status).toBe("CONVERTIDO");
  });
});
