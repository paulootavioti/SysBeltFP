import { Router } from "express";
import { PagamentosController } from "./controller";

const pagamentosRoutes = Router();

const pagamentosController = new PagamentosController();

// Webhooks de gateway não carregam o JWT da aplicação — a autenticação,
// quando a integração existir, será por assinatura/segredo do próprio
// gateway (verificada dentro do controller), não por `ensureAuthenticated`.
pagamentosRoutes.post("/webhook/:gateway", pagamentosController.webhook);

export { pagamentosRoutes };
