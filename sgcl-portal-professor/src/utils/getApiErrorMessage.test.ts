import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { ErroDeUsuario } from "./ErroDeUsuario";
import { MENSAGEM_SEM_CONEXAO, getApiErrorMessage } from "./getApiErrorMessage";

function respostaDaApi(status: number, data: unknown) {
  const erro = new AxiosError("Request failed");
  erro.response = {
    status,
    statusText: "",
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return erro;
}

describe("getApiErrorMessage", () => {
  it("extrai a mensagem devolvida pela API", () => {
    const erro = respostaDaApi(400, {
      message: "Já existe uma mensalidade para este aluno neste mês.",
    });

    expect(getApiErrorMessage(erro)).toBe(
      "Já existe uma mensalidade para este aluno neste mês."
    );
  });

  it("cai no fallback quando a resposta não traz mensagem", () => {
    expect(getApiErrorMessage(respostaDaApi(500, {}), "Falhou.")).toBe("Falhou.");
  });

  it("cai no fallback quando a mensagem da API vem vazia", () => {
    expect(getApiErrorMessage(respostaDaApi(400, { message: "" }), "Falhou.")).toBe("Falhou.");
  });

  // Sem `response`, a requisição nem chegou a ter resposta. Cair no fallback
  // aqui relataria um servidor fora do ar com o texto da tela — numa tela de
  // login, "senha inválida" para um problema de infraestrutura.
  it("distingue servidor inacessível de credencial recusada", () => {
    expect(getApiErrorMessage(new AxiosError("Network Error"), "Senha inválida.")).toBe(
      MENSAGEM_SEM_CONEXAO
    );
  });

  it("mostra a mensagem de uma recusa deliberada da aplicação", () => {
    const erro = new ErroDeUsuario("Este acesso é exclusivo para professores.");

    expect(getApiErrorMessage(erro)).toBe("Este acesso é exclusivo para professores.");
  });

  // Um defeito de programação não pode virar texto de interface.
  it("esconde a mensagem de um erro comum atrás do fallback", () => {
    expect(getApiErrorMessage(new TypeError("Cannot read properties of undefined"))).toBe(
      "Ocorreu um erro inesperado."
    );
  });

  it("usa o texto genérico quando nenhum fallback é informado", () => {
    expect(getApiErrorMessage(undefined)).toBe("Ocorreu um erro inesperado.");
    expect(getApiErrorMessage(null)).toBe("Ocorreu um erro inesperado.");
    expect(getApiErrorMessage("string solta")).toBe("Ocorreu um erro inesperado.");
  });
});
