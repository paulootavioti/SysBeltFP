export function getApiErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return "Erro de conexão com o servidor.";
    }
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    if ("response" in error) {
      const response = (error as any).response;
      if (response?.data?.message) {
        return response.data.message;
      }
    }
  }

  return defaultMessage;
}
