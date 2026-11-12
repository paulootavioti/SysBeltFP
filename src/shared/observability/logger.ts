import { obterContextoRequisicao } from "../context/contextoRequisicao";
import { erroSeguroParaLog } from "../security/sanitizarErro";
import { reportarAlerta, reportarErro } from "./monitoramento";

type Nivel = "info" | "warn" | "error";

// Avisos que viram alerta no Sentry. Os demais warn ficam só no log: um
// webhook com assinatura inválida, por exemplo, é ruído de quem testa a URL.
export const AVISOS_ALERTAVEIS = new Set([
  "concessao_rejeitada",
  "concessao_vencendo",
  "webhook_pagamento_conta_divergente",
  "requisicao_lenta",
]);

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
  warn: (evento: string, dados?: Record<string, unknown>) => {
    escrever("warn", evento, dados);
    if (AVISOS_ALERTAVEIS.has(evento)) reportarAlerta(evento, dados);
  },
  error: (evento: string, erro: unknown, dados: Record<string, unknown> = {}) => {
    escrever("error", evento, { ...dados, erro: erroSeguroParaLog(erro) });
    reportarErro(evento, erro, dados);
  },
};
