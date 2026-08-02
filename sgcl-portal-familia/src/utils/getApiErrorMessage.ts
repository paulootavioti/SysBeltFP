import { AxiosError } from "axios";
interface ApiErrorResponse {
  message?: string;
}
export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
) {
  if (error instanceof AxiosError) {
    // sem "response" = a requisição nem chegou a ter uma resposta (CORS
    // bloqueado, backend fora do ar, VITE_API_URL errada) — reportar isso
    // como se fosse "senha inválida" (o fallback de cada tela) confundiria
    // um problema de infraestrutura com credencial errada.
    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.";
    }

    const data = error.response.data as ApiErrorResponse | undefined;
    return data?.message || fallback;
  }
  return fallback;
}