import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
) {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.";
    }
    const data = error.response.data as ApiErrorResponse | undefined;
    return data?.message || fallback;
  }
  // caso do login(): a checagem de perfil (PROFESSOR/ADMIN) lança um Error
  // simples, sem passar pela API — a mensagem já vem pronta pro usuário.
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
