import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateEventoService } from "./CreateEventoService";
import { UpdateEventoService } from "./UpdateEventoService";
import { DeleteEventoService } from "./DeleteEventoService";
import { ListEventosService } from "./ListEventosService";

const createService = new CreateEventoService();
const updateService = new UpdateEventoService();
const deleteService = new DeleteEventoService();
const listService = new ListEventosService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.evento.deleteMany({ where: { titulo: { startsWith: "TESTE_EVENTOCRUD_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_EVENTOCRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_EVENTOCRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_EVENTOCRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("CreateEventoService", () => {
  it("cria o evento vinculado à unidade informada", async () => {
    const evento = await createService.execute({
      unidadeId: unidadeAId,
      titulo: "TESTE_EVENTOCRUD_SEMINARIO",
      tipo: "SEMINARIO",
      status: "AGENDADO",
      dataInicio: "2026-08-10",
      metaParticipantes: 30,
      participantesConfirmados: 12,
    });

    expect(evento.unidadeId).toBe(unidadeAId);
    expect(evento.status).toBe("AGENDADO");
    expect(evento.metaParticipantes).toBe(30);
  });
});

describe("ListEventosService — filtros", () => {
  it("filtra por busca (título), tipo e status", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      titulo: "TESTE_EVENTOCRUD_CAMPANHA_MATRICULA",
      tipo: "CAMPANHA_MATRICULA",
      status: "EM_ANDAMENTO",
      dataInicio: "2026-07-01",
    });

    await createService.execute({
      unidadeId: unidadeAId,
      titulo: "TESTE_EVENTOCRUD_AULAO_ENCERRAMENTO",
      tipo: "AULAO",
      status: "CONCLUIDO",
      dataInicio: "2026-06-01",
    });

    const porBusca = await listService.execute(unidadeAId, { busca: "campanha" });
    expect(porBusca).toHaveLength(1);
    expect(porBusca[0].titulo).toBe("TESTE_EVENTOCRUD_CAMPANHA_MATRICULA");

    const porTipo = await listService.execute(unidadeAId, { tipo: "AULAO" });
    expect(porTipo).toHaveLength(1);

    const porStatus = await listService.execute(unidadeAId, { status: "CONCLUIDO" });
    expect(porStatus).toHaveLength(1);
    expect(porStatus[0].titulo).toBe("TESTE_EVENTOCRUD_AULAO_ENCERRAMENTO");
  });
});

describe("UpdateEventoService / DeleteEventoService — isolamento entre unidades", () => {
  it("rejeita atualizar e excluir um evento de outra unidade", async () => {
    const evento = await createService.execute({
      unidadeId: unidadeAId,
      titulo: "TESTE_EVENTOCRUD_ISOLAMENTO",
      tipo: "WORKSHOP",
      status: "RASCUNHO",
      dataInicio: "2026-09-01",
    });

    await expect(
      updateService.execute({
        id: evento.id,
        unidadeIdUsuario: unidadeBId,
        titulo: "Tentativa de invasão",
        tipo: "WORKSHOP",
        status: "RASCUNHO",
        dataInicio: "2026-09-01",
      })
    ).rejects.toThrow(AppError);

    await expect(deleteService.execute(evento.id, unidadeBId)).rejects.toThrow(AppError);

    await expect(deleteService.execute(evento.id, unidadeAId)).resolves.toBeUndefined();
  });
});
