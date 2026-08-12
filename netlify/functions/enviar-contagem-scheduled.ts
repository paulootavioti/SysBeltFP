import { EnviarSnapshotContagemService } from "../../src/modules/integracaoControlPlane/EnviarSnapshotContagemService";

export default async () => {
  const resultado = await new EnviarSnapshotContagemService().execute();
  console.log(`Snapshot agregado enviado: ${resultado.eventoId}; duplicado=${resultado.duplicado}`);
};

export const config = {
  schedule: "0 3 * * *",
};
