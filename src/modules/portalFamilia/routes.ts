import { Router } from "express";

import { PortalFamiliaController } from "./controller";
import { ensureAuthenticatedFamilia } from "./middlewares/ensureAuthenticatedFamilia";
import { validateBody } from "../../shared/middlewares/validateBody";
import { loginFamiliaSchema, pagarMensalidadeFamiliaSchema, enviarMensagemFamiliaSchema } from "./validation";

const portalFamiliaRoutes = Router();

const controller = new PortalFamiliaController();

portalFamiliaRoutes.post("/login", validateBody(loginFamiliaSchema), controller.login);

portalFamiliaRoutes.get("/alunos", ensureAuthenticatedFamilia, controller.listarAlunos);

portalFamiliaRoutes.get("/resumo/:alunoId", ensureAuthenticatedFamilia, controller.resumo);

portalFamiliaRoutes.get("/frequencia/:alunoId", ensureAuthenticatedFamilia, controller.frequencia);

portalFamiliaRoutes.get("/mensalidades/:alunoId", ensureAuthenticatedFamilia, controller.mensalidades);

portalFamiliaRoutes.post(
  "/mensalidades/:id/pagar",
  ensureAuthenticatedFamilia,
  validateBody(pagarMensalidadeFamiliaSchema),
  controller.pagarMensalidade
);

portalFamiliaRoutes.get("/agenda/:alunoId", ensureAuthenticatedFamilia, controller.agenda);

portalFamiliaRoutes.get("/mensagens/:alunoId", ensureAuthenticatedFamilia, controller.listarMensagens);

portalFamiliaRoutes.post(
  "/mensagens",
  ensureAuthenticatedFamilia,
  validateBody(enviarMensagemFamiliaSchema),
  controller.enviarMensagem
);

export { portalFamiliaRoutes };
