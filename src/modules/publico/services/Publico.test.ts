import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";
import { GetEquipePublicaService } from "./GetEquipePublicaService";
import { GetHorariosPublicoService } from "./GetHorariosPublicoService";
import { GetProdutosDestaquePublicoService } from "./GetProdutosDestaquePublicoService";
import { GetGaleriaPublicaService } from "./GetGaleriaPublicaService";
import { GetModalidadesPublicoService } from "./GetModalidadesPublicoService";
import { CriarLeadPublicoService } from "./CriarLeadPublicoService";

const modalidadesService = new GetModalidadesPublicoService();
const equipeService = new GetEquipePublicaService();
const horariosService = new GetHorariosPublicoService();
const produtosService = new GetProdutosDestaquePublicoService();
const galeriaService = new GetGaleriaPublicaService();
const leadService = new CriarLeadPublicoService();

let unidadeId: number;
let outraUnidadeId: number;

async function limpar() {
  await prisma.lead.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } });
  await prisma.fotoTreino.deleteMany({ where: { aula: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } });
  await prisma.produto.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } });
  await prisma.turma.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } });
  await prisma.modalidade.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PUBLICO_" } } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_publico_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_PUBLICO_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_PUBLICO_UNIDADE" } });
  unidadeId = unidade.id;

  const outraUnidade = await prisma.unidade.create({ data: { nome: "TESTE_PUBLICO_OUTRA_UNIDADE" } });
  outraUnidadeId = outraUnidade.id;

  process.env.UNIDADE_PUBLICA_ID = String(unidadeId);
});
afterEach(async () => {
  delete process.env.UNIDADE_PUBLICA_ID;
});
afterAll(limpar);

describe("obterUnidadePublicaId", () => {
  it("lança 503 quando a env var não está configurada", () => {
    delete process.env.UNIDADE_PUBLICA_ID;
    expect(() => obterUnidadePublicaId()).toThrow(AppError);
  });
});

describe("GetModalidadesPublicoService", () => {
  it("mostra só as modalidades marcadas como visíveis, na ordem configurada", async () => {
    await prisma.modalidade.createMany({
      data: [
        { unidadeId, nome: "Grappling", publicoAlvo: "Sem kimono", visivelNaLanding: true, ordem: 2 },
        { unidadeId, nome: "Jiu-Jitsu Kids", publicoAlvo: "4 a 13 anos", visivelNaLanding: true, ordem: 1 },
        { unidadeId, nome: "Projeto Social", visivelNaLanding: false, ordem: 0 },
      ],
    });

    const modalidades = await modalidadesService.execute();

    expect(modalidades.map((m) => m.nome)).toEqual(["Jiu-Jitsu Kids", "Grappling"]);
    expect(modalidades[0].publico).toBe("4 a 13 anos");
  });

  it("não vaza modalidade de outra unidade nem modalidade inativa", async () => {
    await prisma.modalidade.createMany({
      data: [
        { unidadeId, nome: "Judô", visivelNaLanding: true, ativo: false },
        { unidadeId: outraUnidadeId, nome: "Boxe", visivelNaLanding: true },
      ],
    });

    expect(await modalidadesService.execute()).toEqual([]);
  });

  it("descreve o público como texto vazio quando não foi preenchido", async () => {
    await prisma.modalidade.create({
      data: { unidadeId, nome: "Defesa Pessoal", visivelNaLanding: true },
    });

    const [modalidade] = await modalidadesService.execute();

    expect(modalidade.publico).toBe("");
    expect(modalidade.descricao).toBe("");
  });
});

describe("GetEquipePublicaService", () => {
  it("lista só professores ativos da unidade pública, com faixa e apelido", async () => {
    await prisma.usuario.create({
      data: {
        unidadeId,
        nome: "Weberty Viana",
        email: "teste_publico_prof1@example.com",
        senha: "hash",
        perfil: "PROFESSOR",
        nivelGraduacao: "Faixa Preta 3º grau",
      },
    });
    await prisma.usuario.create({
      data: {
        unidadeId,
        nome: "Professor Inativo",
        email: "teste_publico_prof2@example.com",
        senha: "hash",
        perfil: "PROFESSOR",
        ativo: false,
      },
    });
    await prisma.usuario.create({
      data: {
        unidadeId: outraUnidadeId,
        nome: "Professor Outra Unidade",
        email: "teste_publico_prof3@example.com",
        senha: "hash",
        perfil: "PROFESSOR",
      },
    });

    const equipe = await equipeService.execute();

    expect(equipe).toHaveLength(1);
    expect(equipe[0].nome).toBe("Weberty Viana");
    expect(equipe[0].faixa).toBe("Faixa Preta 3º grau");
  });
});

describe("GetHorariosPublicoService", () => {
  it("lista só turmas ativas da unidade pública", async () => {
    await prisma.turma.create({
      data: {
        unidadeId,
        nome: "Jiu-Jitsu Kids",
        faixaEtaria: "4 a 13 anos",
        diasSemana: [1, 3],
        horarioInicio: "17:00",
        horarioFim: "18:00",
      },
    });
    await prisma.turma.create({
      data: {
        unidadeId,
        nome: "Turma Inativa",
        faixaEtaria: "Adulto",
        diasSemana: [2],
        horarioInicio: "19:00",
        horarioFim: "20:00",
        ativo: false,
      },
    });

    const horarios = await horariosService.execute();

    expect(horarios).toHaveLength(1);
    expect(horarios[0].nome).toBe("Jiu-Jitsu Kids");
    expect(horarios[0].dias).toBe("segunda-feira e quarta-feira");
  });
});

describe("GetProdutosDestaquePublicoService", () => {
  it("lista só produtos ativos da unidade pública, no máximo 4", async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.produto.create({
        data: { unidadeId, nome: `Produto ${i}`, categoria: "KIMONO", preco: 100 },
      });
    }
    await prisma.produto.create({
      data: { unidadeId, nome: "Produto Inativo", categoria: "KIMONO", preco: 100, ativo: false },
    });

    const produtos = await produtosService.execute();

    expect(produtos).toHaveLength(4);
  });
});

describe("GetGaleriaPublicaService", () => {
  it("lista só fotos visivelNaLanding=true da unidade pública", async () => {
    const professor = await prisma.usuario.create({
      data: {
        unidadeId,
        nome: "TESTE_PUBLICO_PROFESSOR_GALERIA",
        email: "teste_publico_prof_galeria@example.com",
        senha: "hash",
        perfil: "PROFESSOR",
      },
    });
    const aula = await prisma.aula.create({ data: { unidadeId, data: new Date() } });

    await prisma.fotoTreino.create({
      data: { aulaId: aula.id, url: "/uploads/treinos/a.jpg", legenda: "Treino A", publicadaPorId: professor.id, visivelNaLanding: true },
    });
    await prisma.fotoTreino.create({
      data: { aulaId: aula.id, url: "/uploads/treinos/b.jpg", legenda: "Treino B (privada)", publicadaPorId: professor.id, visivelNaLanding: false },
    });

    const galeria = await galeriaService.execute();

    expect(galeria).toHaveLength(1);
    expect(galeria[0].legenda).toBe("Treino A");
  });
});

describe("CriarLeadPublicoService", () => {
  it("cria o lead escopado pela unidade pública", async () => {
    const lead = await leadService.execute({ nome: "Fulano", contato: "11999999999", interesse: "Jiu-Jitsu Adulto" });

    expect(lead.unidadeId).toBe(unidadeId);
    expect(lead.status).toBe("NOVO");
  });
});
