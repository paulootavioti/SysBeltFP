import { Router } from "express";
import { CompeticoesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { competicaoSchema, inscricaoSchema, resultadoSchema } from "./validation";

const competicoesRoutes = Router();

const competicoesController =
  new CompeticoesController();

competicoesRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(competicaoSchema),
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
  validateBody(inscricaoSchema),
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
  validateBody(resultadoSchema),
  competicoesController.resultado
);

competicoesRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  competicoesController.delete
);

export { competicoesRoutes };