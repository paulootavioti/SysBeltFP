import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { instalarStoragesDeTeste } from "../../../testing/storagesDeTeste";
import { enfileirar, lerFila, type AcaoPendente } from "./filaOffline";
import { ehErroDeConexao, sincronizarFila } from "./sincronizarFila";

const storage = instalarStoragesDeTeste();

function erroSemConexao() {
  return new AxiosError("Network Error");
}

function erroDaApi(status: number) {
  const erro = new AxiosError("Requisição recusada");
  erro.response = {
    status,
    statusText: "",
    data: {},
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return erro;
}

function enfileirarPresencas(quantidade: number) {
  for (let alunoId = 1; alunoId <= quantidade; alunoId += 1) {
    enfileirar({ tipo: "presenca", aulaId: 7, payload: { alunoId, presente: true } });
  }
}

const alunosDe = (chamadas: AcaoPendente[][]) => chamadas.map(([acao]) => acao.payload.alunoId);

beforeEach(() => storage.limpar());

describe("ehErroDeConexao", () => {
  it("reconhece a falha em que a request nem saiu", () => {
    expect(ehErroDeConexao(erroSemConexao())).toBe(true);
  });

  // A distinção existe para que um 403 não fique sendo reenviado eternamente.
  it("não trata resposta de erro da API como falta de conexão", () => {
    expect(ehErroDeConexao(erroDaApi(403))).toBe(false);
    expect(ehErroDeConexao(erroDaApi(500))).toBe(false);
  });

  it("não confunde um erro comum com falta de conexão", () => {
    expect(ehErroDeConexao(new Error("qualquer coisa"))).toBe(false);
    expect(ehErroDeConexao(undefined)).toBe(false);
  });
});

describe("sincronizarFila", () => {
  it("não chama nada quando a fila está vazia", async () => {
    const executar = vi.fn();

    expect(await sincronizarFila(executar)).toBe(0);
    expect(executar).not.toHaveBeenCalled();
  });

  it("envia tudo na ordem e esvazia a fila", async () => {
    enfileirarPresencas(3);
    const executar = vi.fn().mockResolvedValue(undefined);

    expect(await sincronizarFila(executar)).toBe(0);
    expect(alunosDe(executar.mock.calls)).toEqual([1, 2, 3]);
    expect(lerFila()).toEqual([]);
  });

  // Sem conexão, insistir nas próximas ações só produziria a mesma falha —
  // e descartá-las perderia o que o professor marcou no tatame.
  it("para na primeira falta de conexão e preserva o restante", async () => {
    enfileirarPresencas(4);
    const executar = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(erroSemConexao());

    expect(await sincronizarFila(executar)).toBe(3);
    expect(executar).toHaveBeenCalledTimes(2);
    expect(lerFila().map((acao) => acao.payload.alunoId)).toEqual([2, 3, 4]);
  });

  it("mantém a fila inteira quando a primeira ação já falha por conexão", async () => {
    enfileirarPresencas(2);
    const executar = vi.fn().mockRejectedValue(erroSemConexao());

    expect(await sincronizarFila(executar)).toBe(2);
    expect(executar).toHaveBeenCalledTimes(1);
  });

  // Uma aula finalizada devolve erro para sempre. Se ela ficasse na fila,
  // travaria todas as marcações enfileiradas depois dela.
  it("descarta a ação recusada pela API e segue com as seguintes", async () => {
    enfileirarPresencas(3);
    const executar = vi
      .fn()
      .mockRejectedValueOnce(erroDaApi(400))
      .mockResolvedValue(undefined);

    expect(await sincronizarFila(executar)).toBe(0);
    expect(alunosDe(executar.mock.calls)).toEqual([1, 2, 3]);
    expect(lerFila()).toEqual([]);
  });

  it("continua depois de um erro que nem é do Axios", async () => {
    enfileirarPresencas(2);
    const executar = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("payload inesperado"))
      .mockResolvedValue(undefined);

    expect(await sincronizarFila(executar)).toBe(0);
    expect(executar).toHaveBeenCalledTimes(2);
  });

  // Cenário real: a conexão cai depois de o servidor já ter gravado. A ação
  // volta na próxima sincronização, e precisa ser inofensiva.
  it("reenvia sem duplicar quando a resposta se perde", async () => {
    enfileirarPresencas(1);
    const primeira = vi.fn().mockRejectedValue(erroSemConexao());

    expect(await sincronizarFila(primeira)).toBe(1);

    const segunda = vi.fn().mockResolvedValue(undefined);
    expect(await sincronizarFila(segunda)).toBe(0);
    expect(alunosDe(segunda.mock.calls)).toEqual([1]);
    expect(lerFila()).toEqual([]);
  });

  it("não lança quando a chave do storage está corrompida", async () => {
    storage.escreverCru("@portalProfessor:filaOffline", '{"nao":"e uma lista"}');
    const executar = vi.fn();

    expect(await sincronizarFila(executar)).toBe(0);
    expect(executar).not.toHaveBeenCalled();
  });
});
