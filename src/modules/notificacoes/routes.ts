import { Router } from "express";
import { NotificacoesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const notificacoesRoutes = Router();

const notificacoesController = new NotificacoesController();

notificacoesRoutes.get(
  "/contadores-menu",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]),
  notificacoesController.contadoresMenu
);

export { notificacoesRoutes };
