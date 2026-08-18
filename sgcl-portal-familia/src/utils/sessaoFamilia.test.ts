import { beforeEach, describe, expect, it } from "vitest";

import type { AlunoResumo, UsuarioFamilia } from "../contexts/authContextData";
import { instalarStoragesDeTeste } from "../testing/storagesDeTeste";
import {
  CHAVE_ALUNOS,
  CHAVE_ALUNO_SELECIONADO,
  CHAVE_TOKEN,
  CHAVE_USUARIO,
  escolherAlunoSelecionado,
  gravarAlunoSelecionado,
  gravarSessao,
  lerSessao,
  limparSessao,
} from "./sessaoFamilia";

const storage = instalarStoragesDeTeste();

const aluno = (id: number, nome: string): AlunoResumo => ({
  id,
  nome,
  apelido: null,
  fotoUrl: null,
  iniciais: nome.slice(0, 2).toUpperCase(),
});

const responsavel: UsuarioFamilia = {
  tipo: "RESPONSAVEL",
  nome: "Maria",
  email: "maria@exemplo.com",
};

const PEDRO = aluno(10, "Pedro");
const ANA = aluno(20, "Ana");

beforeEach(() => storage.limpar());

describe("escolherAlunoSelecionado", () => {
  it("mantém a escolha anterior quando o aluno continua vinculado", () => {
    expect(escolherAlunoSelecionado("20", [PEDRO, ANA])).toBe(20);
  });

  it("cai no primeiro aluno quando não há escolha anterior", () => {
    expect(escolherAlunoSelecionado(null, [PEDRO, ANA])).toBe(10);
  });

  // Um aluno sai da lista do responsável ao completar 18 anos. Aceitar a
  // escolha antiga faria o portal abrir pedindo os dados de alguém que aquele
  // responsável não alcança mais — o backend recusaria, e a tela quebraria sem
  // explicação para quem está olhando.
  it("descarta a escolha anterior quando o aluno saiu do vínculo", () => {
    expect(escolherAlunoSelecionado("20", [PEDRO])).toBe(10);
  });

  it("devolve nulo quando não sobrou nenhum aluno", () => {
    expect(escolherAlunoSelecionado("20", [])).toBeNull();
    expect(escolherAlunoSelecionado(null, [])).toBeNull();
  });

  it("ignora um id salvo que não é número", () => {
    expect(escolherAlunoSelecionado("abc", [PEDRO])).toBe(10);
    expect(escolherAlunoSelecionado("", [PEDRO])).toBe(10);
    expect(escolherAlunoSelecionado("10.5", [PEDRO])).toBe(10);
  });
});

describe("lerSessao", () => {
  it("devolve sessão vazia quando nunca houve login", () => {
    expect(lerSessao()).toEqual({
      usuario: null,
      token: null,
      alunos: [],
      alunoSelecionadoId: null,
    });
  });

  it("restaura o que foi gravado", () => {
    gravarSessao({ usuario: responsavel, token: "jwt", alunos: [PEDRO, ANA], alunoSelecionadoId: 20 });

    expect(lerSessao()).toEqual({
      usuario: responsavel,
      token: "jwt",
      alunos: [PEDRO, ANA],
      alunoSelecionadoId: 20,
    });
  });

  it("não deixa a seleção apontar para fora da lista restaurada", () => {
    gravarSessao({ usuario: responsavel, token: "jwt", alunos: [PEDRO], alunoSelecionadoId: 10 });
    storage.escreverCru(CHAVE_ALUNO_SELECIONADO, "20");

    expect(lerSessao().alunoSelecionadoId).toBe(10);
  });

  it("trata lista de alunos corrompida como lista vazia", () => {
    storage.escreverCru(CHAVE_ALUNOS, '{"nao":"e uma lista"}');
    storage.escreverCru(CHAVE_ALUNO_SELECIONADO, "20");

    const sessao = lerSessao();
    expect(sessao.alunos).toEqual([]);
    expect(sessao.alunoSelecionadoId).toBeNull();
  });

  it("trata usuário corrompido como ausente, sem lançar", () => {
    storage.escreverCru(CHAVE_USUARIO, "não é json");

    expect(() => lerSessao()).not.toThrow();
    expect(lerSessao().usuario).toBeNull();
  });
});

describe("gravarAlunoSelecionado", () => {
  // O id órfão sobrevivendo a um login sem alunos é justamente o que faria o
  // reload restaurar uma seleção que não vale mais.
  it("remove a chave ao gravar nulo, em vez de deixar o id anterior", () => {
    gravarAlunoSelecionado(20);
    gravarAlunoSelecionado(null);

    expect(localStorage.getItem(CHAVE_ALUNO_SELECIONADO)).toBeNull();
  });

  it("sobrescreve a seleção anterior", () => {
    gravarAlunoSelecionado(10);
    gravarAlunoSelecionado(20);

    expect(localStorage.getItem(CHAVE_ALUNO_SELECIONADO)).toBe("20");
  });
});

describe("gravarSessao", () => {
  // Cenário do defeito corrigido: o responsável perde o último aluno vinculado
  // e faz login de novo. Antes, a chave de seleção ficava para trás.
  it("não deixa seleção órfã quando o login não devolve nenhum aluno", () => {
    gravarSessao({ usuario: responsavel, token: "jwt-1", alunos: [ANA], alunoSelecionadoId: 20 });

    gravarSessao({ usuario: responsavel, token: "jwt-2", alunos: [], alunoSelecionadoId: null });

    expect(localStorage.getItem(CHAVE_ALUNO_SELECIONADO)).toBeNull();
    expect(lerSessao().alunoSelecionadoId).toBeNull();
  });
});

describe("limparSessao", () => {
  it("não deixa nenhum resquício da sessão", () => {
    gravarSessao({ usuario: responsavel, token: "jwt", alunos: [PEDRO, ANA], alunoSelecionadoId: 10 });

    limparSessao();

    for (const chave of [CHAVE_USUARIO, CHAVE_TOKEN, CHAVE_ALUNOS, CHAVE_ALUNO_SELECIONADO]) {
      expect(localStorage.getItem(chave)).toBeNull();
    }
    expect(lerSessao()).toEqual({
      usuario: null,
      token: null,
      alunos: [],
      alunoSelecionadoId: null,
    });
  });
});
