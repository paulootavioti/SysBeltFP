import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "./getApiErrorMessage";

describe("getApiErrorMessage", () => {
  it("retorna a mensagem do fallback para erros que não são do Axios", () => {
    expect(getApiErrorMessage(new Error("qualquer coisa"))).toBe("Ocorreu um erro inesperado.");
  });

  it("usa o fallback customizado quando informado", () => {
    expect(getApiErrorMessage(new Error("x"), "Falhou.")).toBe("Falhou.");
  });

  it("extrai a mensagem retornada pela API em um AxiosError", () => {
    const error = new AxiosError("Request failed");
    error.response = {
      data: { message: "Já existe uma mensalidade para este aluno neste mês." },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };

    expect(getApiErrorMessage(error)).toBe("Já existe uma mensalidade para este aluno neste mês.");
  });

  it("usa o fallback quando o AxiosError não tem mensagem no corpo", () => {
    const error = new AxiosError("Network Error");
    expect(getApiErrorMessage(error, "Sem conexão.")).toBe("Sem conexão.");
  });
});
