import { EnviarSnapshotContagemService } from "../../src/modules/integracaoControlPlane/EnviarSnapshotContagemService";
import { validarResultadoAgendado } from "../../src/modules/integracaoControlPlane/validarResultadoAgendado";
import { executarJobAgendado } from "../../src/shared/observability/jobAgendado";

export default () =>
  executarJobAgendado("enviar-contagem", async () => {
    const resultados = await new EnviarSnapshotContagemService().execute();
    const resumo = validarResultadoAgendado(resultados);
    return { enviados: resumo.enviados, duplicados: resumo.duplicados };
  });

export const config = {
  schedule: "0 3 * * *",
};
