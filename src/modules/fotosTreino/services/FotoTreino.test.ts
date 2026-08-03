import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { PublicarFotosTreinoService } from "./PublicarFotosTreinoService";
import { ListFotosTreinoService } from "./ListFotosTreinoService";
import { ToggleVisibilidadeFotoTreinoService } from "./ToggleVisibilidadeFotoTreinoService";
import { ExcluirFotoTreinoService } from "./ExcluirFotoTreinoService";

const publicarService = new PublicarFotosTreinoService();
const listService = new ListFotosTreinoService();
const toggleService = new ToggleVisibilidadeFotoTreinoService();
const excluirService = new ExcluirFotoTreinoService();

let unidadeId: number;
let professorTitularId: number;
let professorOutroId: number;
let adminId: number;
let turmaId: number;

async function limpar() {
  await prisma.fotoTreino.deleteMany({ where: { aula: { turma: { nome: { startsWith: "TESTE_FOTOTREINO_" } } } } });
  await prisma.aulaAluno.deleteMany({ where: { aula: { turma: { nome: { startsWith: "TESTE_FOTOTREINO_" } } } } });
  await prisma.aula.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_FOTOTREINO_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_FOTOTREINO_" } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_FOTOTREINO_" } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_fototreino_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_FOTOTREINO_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_FOTOTREINO_UNIDADE" } });
  unidadeId = unidade.id;

  const professor = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_FOTOTREINO_PROFESSOR",
      email: "teste_fototreino_professor@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorTitularId = professor.id;

  const outroProfessor = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_FOTOTREINO_OUTRO_PROFESSOR",
      email: "teste_fototreino_outro@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorOutroId = outroProfessor.id;

  const admin = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_FOTOTREINO_ADMIN",
      email: "teste_fototreino_admin@example.com",
      senha: "hash",
      perfil: "ADMIN",
    },
  });
  adminId = admin.id;

  const turma = await prisma.turma.create({
    data: {
      unidadeId,
      nome: "TESTE_FOTOTREINO_TURMA",
      faixaEtaria: "Adulto",
      diasSemana: [3],
      horarioInicio: "17:00",
      horarioFim: "18:00",
      professorId: professorTitularId,
    },
  });
  turmaId = turma.id;
});
afterAll(limpar);

async function criarAula() {
  return prisma.aula.create({
    data: { unidadeId, turmaId, data: new Date("2026-08-05T17:00:00") },
  });
}

async function criarAlunoPresente(aulaId: number, nome: string, autorizaUsoImagem = true, presente = true) {
  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome,
      dataNascimento: new Date("2000-01-01"),
      autorizaUsoImagem,
    },
  });

  await prisma.aulaAluno.create({
    data: { aulaId, alunoId: aluno.id, presente },
  });

  return aluno;
}

describe("PublicarFotosTreinoService", () => {
  it("professor publica foto na própria turma e recebe a contagem de famílias presentes", async () => {
    const aula = await criarAula();
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_1");
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_2");
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_FALTOU", true, false);

    const resultado = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino 17h00 · Quarta", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    expect(resultado.fotos).toHaveLength(1);
    expect(resultado.familiasPresentes).toBe(2);
    expect(resultado.fotos[0].visivelNaLanding).toBe(false);
  });

  it("rejeita professor publicando foto de turma de outro professor", async () => {
    const aula = await criarAula();

    await expect(
      publicarService.execute(
        { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
        { id: professorOutroId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(AppError);
  });

  it("bloqueia publicação pública quando aluno presente não autoriza uso de imagem", async () => {
    const aula = await criarAula();
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_SEM_AUTORIZACAO", false);

    await expect(
      publicarService.execute(
        { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: true },
        { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
      )
    ).rejects.toThrow(AppError);
  });

  it("permite publicação privada mesmo sem autorização de imagem de algum presente", async () => {
    const aula = await criarAula();
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_SEM_AUTORIZACAO2", false);

    const resultado = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    expect(resultado.fotos[0].visivelNaLanding).toBe(false);
  });
});

describe("ListFotosTreinoService", () => {
  it("rejeita professor de outra turma listando fotos", async () => {
    const aula = await criarAula();

    await expect(
      listService.execute(aula.id, { id: professorOutroId, perfil: "PROFESSOR", unidadeId })
    ).rejects.toThrow(AppError);
  });

  it("ADMIN lista fotos de qualquer aula da unidade", async () => {
    const aula = await criarAula();
    await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    const fotos = await listService.execute(aula.id, { id: adminId, perfil: "ADMIN", unidadeId });
    expect(fotos).toHaveLength(1);
  });
});

describe("ToggleVisibilidadeFotoTreinoService / ExcluirFotoTreinoService", () => {
  it("rejeita alterar visibilidade se não for ADMIN nem quem publicou", async () => {
    const aula = await criarAula();
    const { fotos } = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    await expect(
      toggleService.execute(fotos[0].id, { id: professorOutroId, perfil: "PROFESSOR", unidadeId })
    ).rejects.toThrow(AppError);
  });

  it("quem publicou pode tornar a foto pública, respeitando a autorização de imagem", async () => {
    const aula = await criarAula();
    await criarAlunoPresente(aula.id, "TESTE_FOTOTREINO_ALUNO_OK");
    const { fotos } = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    const atualizada = await toggleService.execute(fotos[0].id, {
      id: professorTitularId,
      perfil: "PROFESSOR",
      unidadeId,
    });

    expect(atualizada.visivelNaLanding).toBe(true);
  });

  it("ADMIN exclui foto publicada por um professor", async () => {
    const aula = await criarAula();
    const { fotos } = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    await excluirService.execute(fotos[0].id, { id: adminId, perfil: "ADMIN", unidadeId });

    const restantes = await prisma.fotoTreino.findMany({ where: { aulaId: aula.id } });
    expect(restantes).toHaveLength(0);
  });

  it("rejeita excluir se não for ADMIN nem quem publicou", async () => {
    const aula = await criarAula();
    const { fotos } = await publicarService.execute(
      { aulaId: aula.id, urls: ["/uploads/treinos/a.jpg"], legenda: "Treino", visivelNaLanding: false },
      { id: professorTitularId, perfil: "PROFESSOR", unidadeId }
    );

    await expect(
      excluirService.execute(fotos[0].id, { id: professorOutroId, perfil: "PROFESSOR", unidadeId })
    ).rejects.toThrow(AppError);
  });
});
