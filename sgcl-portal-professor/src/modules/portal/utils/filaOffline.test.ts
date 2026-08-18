import { beforeEach, describe, expect, it } from "vitest";

import { instalarStoragesDeTeste } from "../../../testing/storagesDeTeste";
import { enfileirar, lerFila, removerDaFila } from "./filaOffline";

const CHAVE = "@portalProfessor:filaOffline";
const storage = instalarStoragesDeTeste();

const presenca = { tipo: "presenca", aulaId: 7, payload: { alunoId: 1, presente: true } } as const;

beforeEach(() => storage.limpar());

describe("lerFila", () => {
  it("devolve vazio quando nunca houve fila", () => {
    expect(lerFila()).toEqual([]);
  });

  it("devolve vazio quando o conteúdo não é JSON", () => {
    storage.escreverCru(CHAVE, "isto não é json");

    expect(lerFila()).toEqual([]);
  });

  // Sem a checagem de formato, o `for...of` da sincronização lançaria e a fila
  // pararia de esvaziar em silêncio — as presenças ficariam presas no
  // dispositivo do professor sem nenhum aviso na tela.
  it("devolve vazio quando o JSON é válido mas não é uma lista", () => {
    storage.escreverCru(CHAVE, '{"tipo":"presenca"}');

    expect(lerFila()).toEqual([]);
  });

  it("devolve vazio quando o JSON é um valor primitivo", () => {
    storage.escreverCru(CHAVE, '"presenca"');

    expect(lerFila()).toEqual([]);
  });
});

describe("enfileirar", () => {
  it("guarda a ação e a devolve numa releitura", () => {
    enfileirar(presenca);

    const fila = lerFila();
    expect(fila).toHaveLength(1);
    expect(fila[0]).toMatchObject({ tipo: "presenca", aulaId: 7 });
    expect(fila[0].payload).toEqual({ alunoId: 1, presente: true });
  });

  it("preserva a ordem em que as ações foram marcadas", () => {
    enfileirar({ ...presenca, payload: { alunoId: 1, presente: true } });
    enfileirar({ ...presenca, payload: { alunoId: 2, presente: false } });
    enfileirar({ ...presenca, payload: { alunoId: 3, presente: true } });

    expect(lerFila().map((acao) => acao.payload.alunoId)).toEqual([1, 2, 3]);
  });

  // Duas marcações no mesmo milissegundo são comuns quando o professor passa
  // rápido pela lista de alunos. Ids iguais fariam `removerDaFila` apagar as
  // duas ao confirmar só uma.
  it("gera ids distintos mesmo em chamadas consecutivas", () => {
    for (let i = 0; i < 50; i += 1) enfileirar(presenca);

    const ids = lerFila().map((acao) => acao.id);
    expect(new Set(ids).size).toBe(50);
  });

  it("parte do zero quando a chave está corrompida, em vez de lançar", () => {
    storage.escreverCru(CHAVE, "{}");

    expect(() => enfileirar(presenca)).not.toThrow();
    expect(lerFila()).toHaveLength(1);
  });
});

describe("removerDaFila", () => {
  it("remove apenas a ação pedida", () => {
    enfileirar({ ...presenca, payload: { alunoId: 1, presente: true } });
    enfileirar({ ...presenca, payload: { alunoId: 2, presente: true } });
    const [primeira] = lerFila();

    const restante = removerDaFila(primeira.id);

    expect(restante).toHaveLength(1);
    expect(restante[0].payload.alunoId).toBe(2);
    expect(lerFila()).toHaveLength(1);
  });

  it("é inofensiva com um id que não está na fila", () => {
    enfileirar(presenca);

    expect(removerDaFila("id-inexistente")).toHaveLength(1);
  });
});
