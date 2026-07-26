import { Router } from "express";
import { UnidadesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { unidadeSchema } from "./validation";

const unidadesRoutes = Router();

const unidadesController = new UnidadesController();

unidadesRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["SUPERADMIN"]),
  validateBody(unidadeSchema),
  unidadesController.create
);

unidadesRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["SUPERADMIN"]),
  unidadesController.list
);

unidadesRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["SUPERADMIN"]),
  validateBody(unidadeSchema),
  unidadesController.update
);

unidadesRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["SUPERADMIN"]),
  unidadesController.toggleAtivo
);

export { unidadesRoutes };
