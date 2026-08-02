import { describe, expect, it } from "vitest";

import { calcularEscopoFamilia } from "./calcularEscopoFamilia";

const HOJE = new Date();

function dataComIdade(idade: number, ajusteDias = 0): Date {
  const data = new Date(HOJE);
  data.setFullYear(data.getFullYear() - idade);
  data.setDate(data.getDate() + ajusteDias);
  return data;
}

function aluno(id: number, idade: number, nome = `Aluno ${id}`) {
  return { id, nome, apelido: null, fotoUrl: null, dataNascimento: dataComIdade(idade) };
}

describe("calcularEscopoFamilia", () => {
  it("responsável vê os alunos vinculados que ainda são menores de idade", () => {
    const filho1 = aluno(1, 10);
    const filho2 = aluno(2, 15);

    const escopo = calcularEscopoFamilia({
      comoAluno: false,
      comoResponsavel: true,
      alunoProprio: null,
      responsaveis: [
        { nome: "Mãe", aluno: filho1 },
        { nome: "Mãe", aluno: filho2 },
      ],
    });

    expect(escopo.alunos.map((a) => a.id).sort()).toEqual([1, 2]);
    expect(escopo.tipo).toBe("RESPONSAVEL");
    expect(escopo.nome).toBe("Mãe");
  });

  it("responsável perde o acesso a um aluno que já completou 18 anos", () => {
    const filhoMenor = aluno(1, 15);
    const filhoAdulto = aluno(2, 18);

    const escopo = calcularEscopoFamilia({
      comoAluno: false,
      comoResponsavel: true,
      alunoProprio: null,
      responsaveis: [
        { nome: "Pai", aluno: filhoMenor },
        { nome: "Pai", aluno: filhoAdulto },
      ],
    });

    expect(escopo.alunos.map((a) => a.id)).toEqual([1]);
  });

  it("responsável fica sem nenhum aluno se todos já são maiores de idade", () => {
    const escopo = calcularEscopoFamilia({
      comoAluno: false,
      comoResponsavel: true,
      alunoProprio: null,
      responsaveis: [{ nome: "Mãe", aluno: aluno(1, 20) }],
    });

    expect(escopo.alunos).toEqual([]);
  });

  it("aluno maior de idade acessa a própria conta como responsável por si mesmo", () => {
    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: false,
      alunoProprio: aluno(5, 25),
      responsaveis: [],
    });

    expect(escopo.alunos.map((a) => a.id)).toEqual([5]);
    expect(escopo.tipo).toBe("ALUNO");
  });

  it("aluno menor de idade não acessa diretamente mesmo com a senha correta", () => {
    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: false,
      alunoProprio: aluno(5, 15),
      responsaveis: [],
    });

    expect(escopo.alunos).toEqual([]);
  });

  it("aluno faz aniversário de 18 anos hoje já é considerado maior de idade", () => {
    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: false,
      alunoProprio: aluno(9, 18),
      responsaveis: [],
    });

    expect(escopo.alunos.map((a) => a.id)).toEqual([9]);
  });

  it("aluno que faz 18 anos só amanhã ainda é menor hoje", () => {
    const quaseDezoito = { id: 9, nome: "Quase 18", apelido: null, fotoUrl: null, dataNascimento: dataComIdade(18, 1) };

    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: false,
      alunoProprio: quaseDezoito,
      responsaveis: [],
    });

    expect(escopo.alunos).toEqual([]);
  });

  it("mesma pessoa acessa a própria conta (adulta) e a de um irmão menor na mesma sessão", () => {
    const proprioAluno = aluno(1, 20, "Irmão Mais Velho");
    const irmaoMenor = aluno(2, 10, "Irmão Mais Novo");

    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: true,
      alunoProprio: proprioAluno,
      responsaveis: [{ nome: "Irmão Mais Velho", aluno: irmaoMenor }],
    });

    expect(escopo.alunos.map((a) => a.id).sort()).toEqual([1, 2]);
  });

  it("prova só a senha do próprio aluno não dá acesso ao irmão pelo qual também é responsável", () => {
    const proprioAluno = aluno(1, 20, "Irmão Mais Velho");
    const irmaoMenor = aluno(2, 10, "Irmão Mais Novo");

    const escopo = calcularEscopoFamilia({
      comoAluno: true,
      comoResponsavel: false,
      alunoProprio: proprioAluno,
      responsaveis: [{ nome: "Irmão Mais Velho", aluno: irmaoMenor }],
    });

    expect(escopo.alunos.map((a) => a.id)).toEqual([1]);
  });
});
