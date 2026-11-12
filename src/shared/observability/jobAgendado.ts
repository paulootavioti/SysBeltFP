import { logger } from "./logger";
import { descarregarMonitoramento } from "./monitoramento";

/**
 * Corpo comum das Netlify Scheduled Functions: um job que falha vira
 * `job_falhou` (alerta no Sentry) em vez de sumir no log da function, e o
 * envio ao Sentry termina antes de a function ser congelada.
 */
export async function executarJobAgendado(
  job: string,
  tarefa: () => Promise<Record<string, unknown> | void>,
): Promise<Response> {
  const inicio = performance.now();
  try {
    const resumo = await tarefa();
    logger.info("job_concluido", { job, duracaoMs: Math.round(performance.now() - inicio), ...resumo });
    return new Response(null, { status: 204 });
  } catch (erro) {
    logger.error("job_falhou", erro, { job, duracaoMs: Math.round(performance.now() - inicio) });
    return new Response(null, { status: 500 });
  } finally {
    await descarregarMonitoramento();
  }
}
