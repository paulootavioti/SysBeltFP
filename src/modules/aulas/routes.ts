import { Router } from "express";

import { AulasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const aulasRoutes = Router();

const controller = new AulasController();

aulasRoutes.post(
  "/",
  ensureAuthenticated,
  controller.create
);

aulasRoutes.get(
  "/",
  ensureAuthenticated,
  controller.list
);

aulasRoutes.put(
  "/alunos/:id",
  ensureAuthenticated,
  controller.updateAluno
);

aulasRoutes.patch(
  "/:id/finalizar",
  ensureAuthenticated,
  controller.finalizar
);

aulasRoutes.post(
  "/programadas",
  ensureAuthenticated,
  controller.criarProgramada
);

aulasRoutes.get(
  "/programadas",
  ensureAuthenticated,
  controller.listarProgramadas
);

aulasRoutes.patch(
  "/programadas/:id/iniciar",
  ensureAuthenticated,
  controller.iniciarProgramada
);

aulasRoutes.delete(
  "/programadas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.deleteProgramada
);

aulasRoutes.get(
  "/:id",
  ensureAuthenticated,
  controller.show
);

aulasRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.delete
);

export { aulasRoutes };