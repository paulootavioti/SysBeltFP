import { Router } from "express";

import { ResponsaveisController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { responsavelSchema } from "./validation";

const responsaveisRoutes = Router();

const controller = new ResponsaveisController();

responsaveisRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(responsavelSchema),
  controller.create
);

responsaveisRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.list
);

responsaveisRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.show
);

responsaveisRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(responsavelSchema),
  controller.update
);

responsaveisRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.toggleAtivo
);

responsaveisRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.delete
);

responsaveisRoutes.get(
  "/aluno/:alunoId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.listByAluno
);

export { responsaveisRoutes };
