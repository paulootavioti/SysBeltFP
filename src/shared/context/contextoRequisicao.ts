import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

// A LGPD e o próprio requisito de auditoria pedem que o registro diga de
// onde a ação partiu, não só quem a fez. Só que IP e dispositivo vivem no
// `req`, e os services de negócio não recebem `req` — passá-los por
// parâmetro significaria alterar a assinatura de toda função de escrita e
// confiar que ninguém esqueça de repassar.
//
// AsyncLocalStorage resolve isso: o middleware guarda o contexto no início
// da requisição e ele fica disponível em qualquer ponto da mesma cadeia
// assíncrona, sem passar por parâmetro. Se não houver contexto (um cron,
// um script, um teste), a leitura devolve campos nulos em vez de explodir.

export interface ContextoRequisicao {
  ip: string | null;
  dispositivo: string | null;
  // preenchido por ensureAuthenticated, depois que o token é validado —
  // permite auditar services que não recebem usuarioId por parâmetro.
  usuarioId: number | null;
}

const armazenamento = new AsyncLocalStorage<ContextoRequisicao>();

// Limite defensivo: User-Agent é cabeçalho controlado por quem chama, e
// não faz sentido guardar um texto gigante numa coluna de auditoria.
const TAMANHO_MAXIMO_DISPOSITIVO = 255;

function extrairIp(req: Request): string | null {
  // Atrás de proxy (Netlify, Cloudflare, load balancer) o IP real vem no
  // X-Forwarded-For; o primeiro da lista é o cliente original. Sem
  // `trust proxy` configurado, req.ip devolveria o IP do proxy.
  const encaminhado = req.headers["x-forwarded-for"];

  if (typeof encaminhado === "string" && encaminhado.trim()) {
    return encaminhado.split(",")[0].trim();
  }

  if (Array.isArray(encaminhado) && encaminhado.length > 0) {
    return encaminhado[0].split(",")[0].trim();
  }

  return req.ip ?? req.socket?.remoteAddress ?? null;
}

function extrairDispositivo(req: Request): string | null {
  const agente = req.headers["user-agent"];

  if (typeof agente !== "string" || !agente.trim()) return null;

  return agente.trim().slice(0, TAMANHO_MAXIMO_DISPOSITIVO);
}

export function contextoRequisicao(req: Request, _res: Response, next: NextFunction) {
  armazenamento.run(
    { ip: extrairIp(req), dispositivo: extrairDispositivo(req), usuarioId: null },
    next
  );
}

/** Contexto da requisição atual; campos nulos fora de uma requisição. */
export function obterContextoRequisicao(): ContextoRequisicao {
  return armazenamento.getStore() ?? { ip: null, dispositivo: null, usuarioId: null };
}

/** Registra quem está autenticado nesta requisição. */
export function definirUsuarioDoContexto(usuarioId: number) {
  const contexto = armazenamento.getStore();

  if (contexto) contexto.usuarioId = usuarioId;
}

/** Executa `acao` dentro de um contexto — usado em testes e scripts. */
export function comContextoRequisicao<T>(contexto: ContextoRequisicao, acao: () => T): T {
  return armazenamento.run(contexto, acao);
}
