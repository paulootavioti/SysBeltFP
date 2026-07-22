import { Router } from "express";
import { PlanosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { planoSchema } from "./validation";

const planosRoutes = Router();

const planosController = new PlanosController();

planosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(planoSchema),
  planosController.create
);

planosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  planosController.list
);

planosRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(planoSchema),
  planosController.update
);

planosRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  planosController.toggleAtivo
);

export { planosRoutes };
