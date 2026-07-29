import { Router } from "express";
import { AssinaturaEletronicaController } from "./controller";

const assinaturaEletronicaRoutes = Router();

const assinaturaEletronicaController = new AssinaturaEletronicaController();

// Webhooks de provedor não carregam o JWT da aplicação — a autenticação,
// quando a integração existir, será por assinatura/segredo do próprio
// provedor (verificada dentro do controller), não por `ensureAuthenticated`.
assinaturaEletronicaRoutes.post("/webhook/:provedor", assinaturaEletronicaController.webhook);

export { assinaturaEletronicaRoutes };
