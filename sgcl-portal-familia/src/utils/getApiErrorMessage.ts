import { AxiosError } from "axios";
interface ApiErrorResponse {
  message?: string;
}
export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || fallback;
  }
  return fallback;
}