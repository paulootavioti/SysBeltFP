import { Router } from "express";

import { MensagensFamiliaController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { enviarMensagemFamiliaSchema } from "./validation";

const mensagensFamiliaRoutes = Router();

const controller = new MensagensFamiliaController();

// lado da equipe (ADMIN/RECEPCAO) do chat com a família — a mesma
// conversa que o responsável/aluno vê em /portal-familia/mensagens.
mensagensFamiliaRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.list
);

mensagensFamiliaRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(enviarMensagemFamiliaSchema),
  controller.enviar
);

export { mensagensFamiliaRoutes };
