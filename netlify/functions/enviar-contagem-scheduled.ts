import { EnviarSnapshotContagemService } from "../../src/modules/integracaoControlPlane/EnviarSnapshotContagemService";
import { validarResultadoAgendado } from "../../src/modules/integracaoControlPlane/validarResultadoAgendado";

export default async () => {
  const resultados = await new EnviarSnapshotContagemService().execute();
  const resumo = validarResultadoAgendado(resultados);
  console.log(`Snapshots agregados enviados: ${resumo.enviados}; duplicados=${resumo.duplicados}`);
  return new Response(null, { status: 204 });
};

export const config = {
  schedule: "0 3 * * *",
};
