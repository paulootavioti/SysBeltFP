import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { GetAulasHojeProfessorService } from "./GetAulasHojeProfessorService";
import { GetAulaProfessorService } from "./GetAulaProfessorService";
import { MarcarPresencaProfessorService } from "./MarcarPresencaProfessorService";
import { MarcarTecnicaProfessorService } from "./MarcarTecnicaProfessorService";
import { CriarNotaAulaService } from "./CriarNotaAulaService";
import { RegistrarObservacaoAulaService } from "./RegistrarObservacaoAulaService";
import { FinalizarAulaProfessorService } from "./FinalizarAulaProfessorService";
import { criarNotaAulaSchema } from "../validation";
import { intervaloHojeBrasilia } from "../utils/hoje";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const hojeService = new GetAulasHojeProfessorService();
const aulaService = new GetAulaProfessorService();
const presencaService = new MarcarPresencaProfessorService();
const tecnicaService = new MarcarTecnicaProfessorService();
const notaService = new CriarNotaAulaService();
const observacaoService = new RegistrarObservacaoAulaService();
const finalizarService = new FinalizarAulaProfessorService();

async function limpar() {
  await prisma.notaAula.deleteMany({ where: { aula: { turma: { nome: { startsWith: "TESTE_PROF_" } } } } });
  await prisma.fotoTreino.deleteMany({ where: { aula: { turma: { nome: { startsWith: "TESTE_PROF_" } } } } });
  await prisma.aulaAluno.deleteMany({ where: { aula: { turma: { nome: { startsWith: "TESTE_PROF_" } } } } });
  await prisma.aulaProgramada.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_PROF_" } } } });
  await prisma.aula.deleteMany({ where: { turma: { nome: { startsWith: "TESTE_PROF_" } } } });
  await prisma.tecnicaCurriculo.deleteMany({ where: { aulaCurriculo: { modulo: { curriculo: { nome: { startsWith: "TESTE_PROF_" } } } } } });
  await prisma.aulaCurriculo.deleteMany({ where: { modulo: { curriculo: { nome: { startsWith: "TESTE_PROF_" } } } } });
  await prisma.moduloCurriculo.deleteMany({ where: { curriculo: { nome: { startsWith: "TESTE_PROF_" } } } });
  await prisma.curriculo.deleteMany({ where: { nome: { startsWith: "TESTE_PROF_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_PROF_" } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_PROF_" } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_prof_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_PROF_UNIDADE" } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarCenario() {
  const unidade = await criarUnidadeDeTeste("TESTE_PROF_UNIDADE");

  const professor = await prisma.usuario.create({
    data: {
      unidadeId: unidade.id,
      nome: "TESTE_PROF_PROFESSOR",
      email: "teste_prof_professor@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });

  const outroProfessor = await prisma.usuario.create({
    data: {
      unidadeId: unidade.id,
      nome: "TESTE_PROF_OUTRO_PROFESSOR",
      email: "teste_prof_outro@example.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });

  const turma = await prisma.turma.create({
    data: {
      unidadeId: unidade.id,
      nome: "TESTE_PROF_TURMA",
      faixaEtaria: "Adulto",
      diasSemana: [1, 3],
      horarioInicio: "18:00",
      horarioFim: "19:00",
      professorId: professor.id,
    },
  });

  const aluno1 = await prisma.aluno.create({
    data: { unidadeId: unidade.id, nome: "TESTE_PROF_ALUNO_1", dataNascimento: new Date("2000-01-01"), turmaId: turma.id, ativo: true },
  });
  const aluno2 = await prisma.aluno.create({
    data: { unidadeId: unidade.id, nome: "TESTE_PROF_ALUNO_2", dataNascimento: new Date("2000-01-01"), turmaId: turma.id, ativo: true },
  });

  const curriculo = await prisma.curriculo.create({ data: { unidadeId: unidade.id, nome: "TESTE_PROF_CURRICULO" } });
  const modulo = await prisma.moduloCurriculo.create({ data: { nome: "Módulo 1", curriculoId: curriculo.id } });
  const aulaCurriculo = await prisma.aulaCurriculo.create({
    data: { titulo: "Postura e Base", objetivo: "Ensinar postura", moduloId: modulo.id },
  });
  const tecnica1 = await prisma.tecnicaCurriculo.create({ data: { nome: "Queda de quadril", aulaCurriculoId: aulaCurriculo.id } });
  const tecnica2 = await prisma.tecnicaCurriculo.create({ data: { nome: "Raspagem básica", aulaCurriculoId: aulaCurriculo.id } });

  const aula = await prisma.aula.create({
    data: {
      unidadeId: unidade.id,
      data: new Date(),
      turmaId: turma.id,
      aulaCurriculoId: aulaCurriculo.id,
      status: "ABERTA",
      alunos: { create: [{ alunoId: aluno1.id }, { alunoId: aluno2.id }] },
    },
  });

  return { unidade, professor, outroProfessor, turma, aluno1, aluno2, curriculo, modulo, aulaCurriculo, tecnica1, tecnica2, aula };
}

function solicitanteDe(usuario: { id: number; perfil: string; unidadeId: number | null }) {
  return { id: usuario.id, perfil: usuario.perfil, unidadeId: usuario.unidadeId };
}

describe("GetAulasHojeProfessorService", () => {
  it("lista as aulas de hoje só das turmas do professor logado, com a mais próxima em destaque", async () => {
    const { unidade, professor, turma } = await criarCenario();

    const outraTurma = await prisma.turma.create({
      data: {
        unidadeId: unidade.id,
        nome: "TESTE_PROF_TURMA_2",
        faixaEtaria: "Kids",
        diasSemana: [1],
        horarioInicio: "07:00",
        horarioFim: "08:00",
        professorId: professor.id,
      },
    });

    const hoje = new Date();
    // AulaProgramada.data é a meia-noite UTC do dia (ver utils/hoje.ts).
    // Gravar `new Date()` cru deixava o teste falhar entre 21h e meia-noite
    // de Brasília, quando o instante atual já caiu no dia UTC seguinte e
    // sai da janela consultada.
    const diaDeHoje = intervaloHojeBrasilia(hoje).inicio;

    await prisma.aulaProgramada.create({
      data: { unidadeId: unidade.id, turmaId: outraTurma.id, data: diaDeHoje, status: "PENDENTE" },
    });
    await prisma.aulaProgramada.create({
      data: { unidadeId: unidade.id, turmaId: turma.id, data: diaDeHoje, status: "PENDENTE" },
    });

    const resultado = await hojeService.execute(solicitanteDe(professor), hoje);

    expect(resultado.proximaAula).not.toBeNull();
    expect(resultado.proximaAula?.horarioInicio).toBe("07:00");
    expect(resultado.outrasHoje).toHaveLength(1);
    expect(resultado.outrasHoje[0].horarioInicio).toBe("18:00");
  });

  it("não mostra aulas de turmas de outro professor", async () => {
    const { unidade, professor, outroProfessor } = await criarCenario();

    const turmaDoOutro = await prisma.turma.create({
      data: {
        unidadeId: unidade.id,
        nome: "TESTE_PROF_TURMA_OUTRO",
        faixaEtaria: "Adulto",
        diasSemana: [1],
        horarioInicio: "20:00",
        horarioFim: "21:00",
        professorId: outroProfessor.id,
      },
    });
    await prisma.aulaProgramada.create({
      data: {
        unidadeId: unidade.id,
        turmaId: turmaDoOutro.id,
        data: intervaloHojeBrasilia(new Date()).inicio,
        status: "PENDENTE",
      },
    });

    const resultado = await hojeService.execute(solicitanteDe(professor), new Date());

    expect(resultado.proximaAula).toBeNull();
    expect(resultado.outrasHoje).toHaveLength(0);
  });
});

describe("GetAulaProfessorService", () => {
  it("retorna a aula com as notas já registradas, só pro professor titular", async () => {
    const { professor, outroProfessor, aula, aluno1 } = await criarCenario();

    await prisma.notaAula.create({ data: { aulaId: aula.id, alunoId: aluno1.id, tag: "Evoluiu bem", criadoPorId: professor.id } });

    const resultado = await aulaService.execute(aula.id, solicitanteDe(professor));
    expect(resultado.notas).toHaveLength(1);
    expect(resultado.notas[0].tag).toBe("Evoluiu bem");
    expect(resultado.alunos.every((registro) => typeof registro.frequenciaMes === "number")).toBe(true);

    await expect(aulaService.execute(aula.id, solicitanteDe(outroProfessor))).rejects.toThrow(AppError);
  });
});

describe("MarcarPresencaProfessorService", () => {
  it("marca presença de um aluno da aula", async () => {
    const { professor, aula, aluno1 } = await criarCenario();

    const registro = await presencaService.execute(aula.id, { alunoId: aluno1.id, presente: true }, solicitanteDe(professor));
    expect(registro.presente).toBe(true);
  });

  it("lança erro se o aluno não faz parte da aula", async () => {
    const { unidade, professor, aula } = await criarCenario();
    const alunoDeFora = await prisma.aluno.create({
      data: { unidadeId: unidade.id, nome: "TESTE_PROF_ALUNO_FORA", dataNascimento: new Date("2000-01-01"), ativo: true },
    });

    await expect(
      presencaService.execute(aula.id, { alunoId: alunoDeFora.id, presente: true }, solicitanteDe(professor))
    ).rejects.toThrow(AppError);
  });
});

describe("MarcarTecnicaProfessorService", () => {
  it("marca e desmarca uma técnica como executada", async () => {
    const { professor, aula, tecnica1 } = await criarCenario();

    const marcada = await tecnicaService.execute(aula.id, { tecnicaId: tecnica1.id, executada: true }, solicitanteDe(professor));
    expect(marcada.tecnicasRealizadas.map((t) => t.id)).toContain(tecnica1.id);

    const desmarcada = await tecnicaService.execute(aula.id, { tecnicaId: tecnica1.id, executada: false }, solicitanteDe(professor));
    expect(desmarcada.tecnicasRealizadas.map((t) => t.id)).not.toContain(tecnica1.id);
  });

  it("professor de outra turma não pode registrar técnica", async () => {
    const { outroProfessor, aula, tecnica1 } = await criarCenario();

    await expect(
      tecnicaService.execute(aula.id, { tecnicaId: tecnica1.id, executada: true }, solicitanteDe(outroProfessor))
    ).rejects.toThrow(AppError);
  });
});

describe("CriarNotaAulaService", () => {
  it("cria uma nota com tag pra um aluno presente na aula", async () => {
    const { professor, aula, aluno1 } = await criarCenario();

    const nota = await notaService.execute(aula.id, { alunoId: aluno1.id, tag: "Ótima atitude" }, solicitanteDe(professor));
    expect(nota.tag).toBe("Ótima atitude");
    expect(nota.criadoPorId).toBe(professor.id);
  });

  it("exige tag ou texto (validado no schema)", () => {
    const resultado = criarNotaAulaSchema.safeParse({ alunoId: 1 });
    expect(resultado.success).toBe(false);
  });
});

describe("RegistrarObservacaoAulaService", () => {
  it("registra a observação da turma e bloqueia depois de finalizada", async () => {
    const { professor, aula } = await criarCenario();

    const atualizada = await observacaoService.execute(aula.id, "Turma animada hoje.", solicitanteDe(professor));
    expect(atualizada.observacoes).toBe("Turma animada hoje.");

    await prisma.aula.update({ where: { id: aula.id }, data: { status: "FINALIZADA" } });
    await expect(observacaoService.execute(aula.id, "Outra observação", solicitanteDe(professor))).rejects.toThrow(AppError);
  });
});

describe("FinalizarAulaProfessorService", () => {
  it("finaliza a aula e devolve o resumo com presença e técnicas", async () => {
    const { professor, aula, aluno1, aluno2, tecnica1 } = await criarCenario();

    await presencaService.execute(aula.id, { alunoId: aluno1.id, presente: true }, solicitanteDe(professor));
    await presencaService.execute(aula.id, { alunoId: aluno2.id, presente: false }, solicitanteDe(professor));
    await tecnicaService.execute(aula.id, { tecnicaId: tecnica1.id, executada: true }, solicitanteDe(professor));
    await notaService.execute(aula.id, { alunoId: aluno1.id, tag: "Evoluiu bem" }, solicitanteDe(professor));

    const resumo = await finalizarService.execute(aula.id, solicitanteDe(professor));

    expect(resumo.presenca).toEqual({ presentes: 1, total: 2, percentual: 50 });
    expect(resumo.tecnicas).toEqual({ executadas: 1, planejadas: 2 });
    expect(resumo.alunosComNota).toBe(1);

    const aulaFinalizada = await prisma.aula.findUniqueOrThrow({ where: { id: aula.id } });
    expect(aulaFinalizada.status).toBe("FINALIZADA");
  });
});
