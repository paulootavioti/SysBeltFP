import { EnviarSnapshotContagemService } from "../../src/modules/integracaoControlPlane/EnviarSnapshotContagemService";

type ResultadoSnapshot = { tenantKey: string; eventoId?: string; duplicado?: boolean; erro?: string };

export function validarResultadoAgendado(resultados: ResultadoSnapshot[]) {
  const falhas = resultados.filter((resultado) => resultado.erro);
  if (falhas.length > 0) {
    throw new Error(`Falha no envio de ${falhas.length} de ${resultados.length} snapshot(s).`);
  }
  return { enviados: resultados.length, duplicados: resultados.filter((resultado) => resultado.duplicado).length };
}

export default async () => {
  const resultados = await new EnviarSnapshotContagemService().execute();
  const resumo = validarResultadoAgendado(resultados);
  console.log(`Snapshots agregados enviados: ${resumo.enviados}; duplicados=${resumo.duplicados}`);
  return new Response(null, { status: 204 });
};

export const config = {
  schedule: "0 3 * * *",
};
