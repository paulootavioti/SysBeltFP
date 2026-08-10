import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateModalidadeService } from "./CreateModalidadeService";
import { UpdateModalidadeService } from "./UpdateModalidadeService";
import { ListModalidadesService } from "./ListModalidadesService";
import { ToggleAtivoModalidadeService } from "./ToggleAtivoModalidadeService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const criar = new CreateModalidadeService();
const atualizar = new UpdateModalidadeService();
const listar = new ListModalidadesService();
const alternarAtivo = new ToggleAtivoModalidadeService();

const PREFIXO = "TESTE_MODAL_";

async function limpar() {
  await prisma.turma.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.modalidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.usuarioUnidade.deleteMany({ where: { usuario: { email: { startsWith: "teste_modal_" } } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_modal_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarUnidades() {
  const unidade = await criarUnidadeDeTeste(`${PREFIXO}MATRIZ`);
  const outra = await criarUnidadeDeTeste(`${PREFIXO}FILIAL`);

  return { unidadeId: unidade.id, outraUnidadeId: outra.id };
}

describe("CreateModalidadeService", () => {
  it("cria a modalidade vinculada à unidade e com os padrões seguros", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "Muay Thai" });

    expect(modalidade.unidadeId).toBe(unidadeId);
    // uma modalidade nova não aparece na vitrine sem alguém decidir isso.
    expect(modalidade.visivelNaLanding).toBe(false);
    expect(modalidade.ativo).toBe(true);
  });

  it("remove espaços sobrando do nome", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "  Judô  " });

    expect(modalidade.nome).toBe("Judô");
  });

  it("rejeita nome repetido na mesma unidade, com mensagem de gente", async () => {
    const { unidadeId } = await criarUnidades();

    await criar.execute({ unidadeId, nome: "Jiu-Jitsu" });

    await expect(criar.execute({ unidadeId, nome: "Jiu-Jitsu" })).rejects.toThrow(
      /já existe uma modalidade/i
    );
  });

  it("permite o mesmo nome em unidades diferentes", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    await criar.execute({ unidadeId, nome: "Jiu-Jitsu" });
    const naFilial = await criar.execute({ unidadeId: outraUnidadeId, nome: "Jiu-Jitsu" });

    expect(naFilial.id).toBeDefined();
  });

  it("recusa coordenador que não atende a unidade", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    const deOutraUnidade = await prisma.usuario.create({
      data: {
        unidadeId: outraUnidadeId,
        nome: `${PREFIXO}PROF`,
        email: "teste_modal_prof@x.com",
        senha: "x",
        perfil: "PROFESSOR",
      },
    });

    await expect(
      criar.execute({ unidadeId, nome: "Boxe", coordenadorId: deOutraUnidade.id })
    ).rejects.toThrow(/vinculado a esta unidade/i);
  });

  it("aceita coordenador vinculado à unidade por vínculo múltiplo", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    const professor = await prisma.usuario.create({
      data: {
        unidadeId: outraUnidadeId,
        nome: `${PREFIXO}PROF2`,
        email: "teste_modal_prof2@x.com",
        senha: "x",
        perfil: "PROFESSOR",
        unidadesVinculadas: { create: [{ unidadeId }] },
      },
    });

    const modalidade = await criar.execute({
      unidadeId,
      nome: "Wrestling",
      coordenadorId: professor.id,
    });

    expect(modalidade.coordenadorId).toBe(professor.id);
  });
});

describe("ListModalidadesService", () => {
  it("só devolve as da própria unidade, ordenadas por ordem e depois nome", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    await criar.execute({ unidadeId, nome: "Zumba", ordem: 1 });
    await criar.execute({ unidadeId, nome: "Aikido", ordem: 2 });
    await criar.execute({ unidadeId, nome: "Boxe", ordem: 1 });
    await criar.execute({ unidadeId: outraUnidadeId, nome: "Karatê" });

    const lista = await listar.execute(unidadeId);

    expect(lista.map((m) => m.nome)).toEqual(["Boxe", "Zumba", "Aikido"]);
  });

  it("com apenasAtivas, esconde as inativas", async () => {
    const { unidadeId } = await criarUnidades();

    const ativa = await criar.execute({ unidadeId, nome: "Ativa" });
    const inativa = await criar.execute({ unidadeId, nome: "Inativa" });
    await alternarAtivo.execute(inativa.id, unidadeId);

    const lista = await listar.execute(unidadeId, { apenasAtivas: true });

    expect(lista.map((m) => m.id)).toEqual([ativa.id]);
  });

  it("SUPERADMIN (unidadeId null) enxerga todas as unidades", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    await criar.execute({ unidadeId, nome: "Uma" });
    await criar.execute({ unidadeId: outraUnidadeId, nome: "Outra" });

    const lista = await listar.execute(null);

    expect(lista.length).toBeGreaterThanOrEqual(2);
  });
});

describe("UpdateModalidadeService", () => {
  it("atualiza os campos da vitrine", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "Judô" });

    const atualizada = await atualizar.execute(
      modalidade.id,
      { nome: "Judô", descricao: "Arte suave", publicoAlvo: "6+ anos", visivelNaLanding: true },
      unidadeId
    );

    expect(atualizada.descricao).toBe("Arte suave");
    expect(atualizada.visivelNaLanding).toBe(true);
  });

  it("rejeita editar modalidade de outra unidade", async () => {
    const { unidadeId, outraUnidadeId } = await criarUnidades();

    const daFilial = await criar.execute({ unidadeId: outraUnidadeId, nome: "Karatê" });

    await expect(
      atualizar.execute(daFilial.id, { nome: "Karatê" }, unidadeId)
    ).rejects.toThrow(AppError);
  });
});

describe("ToggleAtivoModalidadeService", () => {
  it("alterna ativo e volta atrás", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "Capoeira" });

    expect((await alternarAtivo.execute(modalidade.id, unidadeId)).ativo).toBe(false);
    expect((await alternarAtivo.execute(modalidade.id, unidadeId)).ativo).toBe(true);
  });

  it("não deixa inativar modalidade com turma ativa em andamento", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "MMA" });

    await prisma.turma.create({
      data: {
        unidadeId,
        modalidadeId: modalidade.id,
        nome: `${PREFIXO}TURMA`,
        faixaEtaria: "Adulto",
        diasSemana: [1],
        horarioInicio: "19:00",
        horarioFim: "20:00",
        ativo: true,
      },
    });

    await expect(alternarAtivo.execute(modalidade.id, unidadeId)).rejects.toThrow(
      /turma\(s\) ativa\(s\)/i
    );
  });

  it("deixa inativar quando as turmas já foram encerradas", async () => {
    const { unidadeId } = await criarUnidades();

    const modalidade = await criar.execute({ unidadeId, nome: "Karatê" });

    await prisma.turma.create({
      data: {
        unidadeId,
        modalidadeId: modalidade.id,
        nome: `${PREFIXO}TURMA_ENCERRADA`,
        faixaEtaria: "Adulto",
        diasSemana: [1],
        horarioInicio: "19:00",
        horarioFim: "20:00",
        ativo: false,
      },
    });

    expect((await alternarAtivo.execute(modalidade.id, unidadeId)).ativo).toBe(false);
  });
});
