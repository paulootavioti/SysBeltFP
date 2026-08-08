import { Router } from "express";

import { WhatsappController } from "./controller";

// Webhook não carrega o JWT da aplicação: a autenticação é a assinatura
// da Meta sobre o corpo cru (ver providers/assinaturaMeta.ts).
const whatsappRoutes = Router();

const controller = new WhatsappController();

whatsappRoutes.get("/webhook", controller.verificar);
whatsappRoutes.post("/webhook", controller.receber);

export { whatsappRoutes };
