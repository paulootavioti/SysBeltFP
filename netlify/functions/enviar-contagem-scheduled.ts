import { EnviarSnapshotContagemService } from "../../src/modules/integracaoControlPlane/EnviarSnapshotContagemService";
import { validarResultadoAgendado } from "../../src/modules/integracaoControlPlane/validarResultadoAgendado";
import { logger } from "../../src/shared/observability/logger";

export default async () => {
  const resultados = await new EnviarSnapshotContagemService().execute();
  const resumo = validarResultadoAgendado(resultados);
  logger.info("snapshot_contagem_enviado", { enviados: resumo.enviados, duplicados: resumo.duplicados });
  return new Response(null, { status: 204 });
};

export const config = {
  schedule: "0 3 * * *",
};
