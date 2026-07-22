import { Router } from "express";
import { TurmasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { turmaSchema } from "./validation";

const turmasRoutes = Router();

const turmasController =
  new TurmasController();

turmasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  validateBody(turmaSchema),
  turmasController.create
);

turmasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  turmasController.list
);

turmasRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  turmasController.show
);

turmasRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  validateBody(turmaSchema),
  turmasController.update
);

turmasRoutes.patch(
  "/:turmaId/alunos/:alunoId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  turmasController.vincularAluno
);

turmasRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  turmasController.toggleAtivo
);

export { turmasRoutes };