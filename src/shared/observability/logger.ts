import { obterContextoRequisicao } from "../context/contextoRequisicao";
import { erroSeguroParaLog } from "../security/sanitizarErro";

type Nivel = "info" | "warn" | "error";

function escrever(nivel: Nivel, evento: string, dados: Record<string, unknown> = {}) {
  const contexto = obterContextoRequisicao();
  const registro = JSON.stringify({
    timestamp: new Date().toISOString(),
    nivel,
    evento,
    requestId: contexto.requestId,
    usuarioId: contexto.usuarioId,
    ...dados,
  });
  const destino = nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.info;
  destino(registro);
}

export const logger = {
  info: (evento: string, dados?: Record<string, unknown>) => escrever("info", evento, dados),
  warn: (evento: string, dados?: Record<string, unknown>) => escrever("warn", evento, dados),
  error: (evento: string, erro: unknown, dados: Record<string, unknown> = {}) =>
    escrever("error", evento, { ...dados, erro: erroSeguroParaLog(erro) }),
};
