import { VerificarConcessoesService } from "../../src/modules/concessaoPlataforma/VerificarConcessoesService";
import { executarJobAgendado } from "../../src/shared/observability/jobAgendado";

// Todo dia às 11h UTC (8h em Brasília): avisa concessões a menos de 7 dias
// de vencer e as que já venceram sem renovação.
export default () => executarJobAgendado("verificar-concessoes", () => new VerificarConcessoesService().execute());

export const config = {
  schedule: "0 11 * * *",
};
