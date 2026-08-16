const PADROES_SENSIVEIS: Array<[RegExp, string]> = [
  [/\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[CONNECTION_STRING_REDACTED]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [TOKEN_REDACTED]"],
  [
    /(x-sysbelt-directory-secret["']?\s*[:=]\s*["']?)[^\s"',}]+/gi,
    "$1[SECRET_REDACTED]",
  ],
];

export function sanitizarTextoParaLog(texto: string): string {
  return PADROES_SENSIVEIS.reduce(
    (resultado, [padrao, substituicao]) => resultado.replace(padrao, substituicao),
    texto,
  );
}

export function erroSeguroParaLog(erro: unknown): Record<string, unknown> {
  if (erro instanceof Error) {
    return {
      name: erro.name,
      message: sanitizarTextoParaLog(erro.message),
      ...(erro.stack ? { stack: sanitizarTextoParaLog(erro.stack) } : {}),
    };
  }

  return { name: "UnknownError", message: sanitizarTextoParaLog(String(erro)) };
}
