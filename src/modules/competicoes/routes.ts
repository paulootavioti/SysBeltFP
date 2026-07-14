import { Router } from "express";
import { CompeticoesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const competicoesRoutes = Router();

const competicoesController =
  new CompeticoesController();

competicoesRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  competicoesController.create
);

competicoesRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  competicoesController.list
);

competicoesRoutes.post(
  "/inscricao",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  competicoesController.inscrever
);

competicoesRoutes.get(
  "/:id/atletas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  competicoesController.atletas
);

competicoesRoutes.patch(
  "/inscricao/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  competicoesController.resultado
);

competicoesRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  competicoesController.delete
);

export { competicoesRoutes };