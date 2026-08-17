import { AxiosError } from "axios";

import { ErroDeUsuario } from "./ErroDeUsuario";

interface ApiErrorResponse {
  message?: string;
}

export const MENSAGEM_SEM_CONEXAO =
  "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
) {
  if (error instanceof AxiosError) {
    // Sem `response`, a requisição nem chegou a ter resposta (backend fora do
    // ar, CORS bloqueado, VITE_API_URL errada). Cair no fallback aqui seria
    // relatar um problema de infraestrutura com o texto da tela — numa tela de
    // login, "senha inválida" para um servidor que não respondeu.
    if (!error.response) {
      return MENSAGEM_SEM_CONEXAO;
    }

    const data = error.response.data as ApiErrorResponse | undefined;
    return data?.message || fallback;
  }

  // Recusa deliberada da aplicação, com mensagem já escrita para o usuário.
  if (error instanceof ErroDeUsuario) {
    return error.message;
  }

  return fallback;
}
