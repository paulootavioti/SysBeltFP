export type ResultadoSnapshot = { tenantKey: string; eventoId?: string; duplicado?: boolean; erro?: string };

export function validarResultadoAgendado(resultados: ResultadoSnapshot[]) {
  const falhas = resultados.filter((resultado) => resultado.erro);
  if (falhas.length > 0) {
    throw new Error(`Falha no envio de ${falhas.length} de ${resultados.length} snapshot(s).`);
  }
  return { enviados: resultados.length, duplicados: resultados.filter((resultado) => resultado.duplicado).length };
}
