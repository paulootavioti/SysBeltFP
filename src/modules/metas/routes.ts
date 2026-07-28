import { Router } from "express";
import { MetasController } from "./controller";

import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { metaSchema } from "./validation";

const metasRoutes = Router();

const metasController = new MetasController();

metasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  metasController.list
);

metasRoutes.get(
  "/dashboard",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  metasController.list
);

metasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(metaSchema),
  metasController.create
);

metasRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(metaSchema),
  metasController.update
);

metasRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  metasController.delete
);

export { metasRoutes };
