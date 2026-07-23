import { Router } from "express";

import { AulasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  iniciarAulaSchema,
  updateAulaAlunoSchema,
  criarAulaProgramadaSchema,
  updateAulaSchema,
} from "./validation";

const aulasRoutes = Router();

const controller = new AulasController();

aulasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(iniciarAulaSchema),
  controller.create
);

aulasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.list
);

aulasRoutes.put(
  "/alunos/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(updateAulaAlunoSchema),
  controller.updateAluno
);

aulasRoutes.patch(
  "/:id/finalizar",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  controller.finalizar
);

aulasRoutes.post(
  "/programadas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(criarAulaProgramadaSchema),
  controller.criarProgramada
);

aulasRoutes.get(
  "/programadas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.listarProgramadas
);

aulasRoutes.patch(
  "/programadas/:id/iniciar",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  controller.iniciarProgramada
);

aulasRoutes.delete(
  "/programadas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.deleteProgramada
);

aulasRoutes.get(
  "/grade-semanal",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.gradeSemanal
);

aulasRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.show
);

aulasRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(updateAulaSchema),
  controller.update
);

aulasRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.delete
);

export { aulasRoutes };
