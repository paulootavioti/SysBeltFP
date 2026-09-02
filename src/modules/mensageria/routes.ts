import { Router } from "express";
import multer from "multer";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureCronSecret } from "../../shared/middlewares/ensureCronSecret";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { MensageriaController } from "./controller";
import { MetaWebhookController } from "./metaController";

const metaWebhookRoutes = Router();
const mensageriaRoutes = Router();
const meta = new MetaWebhookController();
const controller = new MensageriaController();
const uploadAnexo = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024, files: 1 } });

metaWebhookRoutes.get("/:canal", meta.verificar.bind(meta));
metaWebhookRoutes.post("/:canal", meta.receber.bind(meta));

mensageriaRoutes.post("/inbox/processar", ensureCronSecret, controller.processar.bind(controller));
mensageriaRoutes.post("/bot/lembrar", ensureCronSecret, controller.lembrar.bind(controller));
mensageriaRoutes.post("/mensagens/despachar", ensureCronSecret, controller.despachar.bind(controller));
mensageriaRoutes.post("/midias/processar", ensureCronSecret, controller.processarMidias.bind(controller));
mensageriaRoutes.post("/canais-mensageria/manter", ensureCronSecret, controller.manterCanais.bind(controller));
mensageriaRoutes.post("/templates/sincronizar", ensureCronSecret, controller.sincronizarTodosTemplates.bind(controller));
mensageriaRoutes.use(ensureAuthenticated);
mensageriaRoutes.get("/bot/fluxos", ensureRole(["ADMIN"]), controller.obterFluxo.bind(controller));
mensageriaRoutes.put("/bot/fluxos", ensureRole(["ADMIN"]), controller.publicarFluxo.bind(controller));
mensageriaRoutes.get("/canais-mensageria", ensureRole(["ADMIN"]), controller.listarCanais.bind(controller));
mensageriaRoutes.get("/templates", ensureRole(["ADMIN", "RECEPCAO"]), controller.listarTemplates.bind(controller));
mensageriaRoutes.post("/canais-mensageria/meta", ensureRole(["ADMIN"]), controller.conectarCanal.bind(controller));
mensageriaRoutes.delete("/canais-mensageria/:id", ensureRole(["ADMIN"]), controller.desativarCanal.bind(controller));
mensageriaRoutes.post("/canais-mensageria/:id/diagnosticar", ensureRole(["ADMIN"]), controller.diagnosticarCanal.bind(controller));
mensageriaRoutes.post("/canais-mensageria/:id/templates/sincronizar", ensureRole(["ADMIN"]), controller.sincronizarTemplates.bind(controller));
mensageriaRoutes.get("/conversas", ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]), controller.listarConversas.bind(controller));
mensageriaRoutes.get("/conversas/:id", ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]), controller.obterConversa.bind(controller));
mensageriaRoutes.post("/conversas/:id/mensagens", ensureRole(["ADMIN", "RECEPCAO"]), controller.responder.bind(controller));
mensageriaRoutes.post("/conversas/:id/anexos", ensureRole(["ADMIN", "RECEPCAO"]), uploadAnexo.single("arquivo"), controller.enviarAnexo.bind(controller));
mensageriaRoutes.post("/mensagens/:id/reenviar", ensureRole(["ADMIN", "RECEPCAO"]), controller.reenviarMensagem.bind(controller));
mensageriaRoutes.post("/conversas/:id/assumir", ensureRole(["ADMIN", "RECEPCAO"]), controller.assumir.bind(controller));
mensageriaRoutes.post("/conversas/:id/encerrar", ensureRole(["ADMIN", "RECEPCAO"]), controller.encerrar.bind(controller));

export { mensageriaRoutes, metaWebhookRoutes };
