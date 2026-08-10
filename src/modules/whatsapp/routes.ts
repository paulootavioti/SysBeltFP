import { Router } from "express";

import { WhatsappController } from "./controller";
import { ensureCronSecret } from "../../shared/middlewares/ensureCronSecret";

// Webhook não carrega o JWT da aplicação: a autenticação é a assinatura
// da Meta sobre o corpo cru (ver providers/assinaturaMeta.ts).
const whatsappRoutes = Router();

const controller = new WhatsappController();

whatsappRoutes.get("/webhook", controller.verificar);
whatsappRoutes.post("/webhook", controller.receber);

// Réguas, disparadas por cron externo. Autenticação por segredo
// compartilhado — ver src/shared/middlewares/ensureCronSecret.ts.
//
// Sugestão de horário (fuso de Brasília):
//   régua de cobrança — uma vez por dia, de manhã
//   lembrete de aula  — uma vez por dia, cedo
whatsappRoutes.post("/regua-cobranca/cron", ensureCronSecret, controller.reguaCobranca);
whatsappRoutes.post("/lembrete-aula/cron", ensureCronSecret, controller.lembreteAula);

export { whatsappRoutes };
