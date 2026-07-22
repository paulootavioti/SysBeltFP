import { Router } from "express";

import { TecnicasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { tecnicaSchema } from "./validation";

const tecnicasRoutes = Router();

const controller = new TecnicasController();

tecnicasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(tecnicaSchema),
  controller.create
);

tecnicasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  controller.list
);

export { tecnicasRoutes };
