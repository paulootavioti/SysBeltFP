import { Router } from "express";
import { EventosController } from "./controller";

import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { eventoSchema } from "./validation";

const eventosRoutes = Router();

const eventosController = new EventosController();

eventosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  eventosController.list
);

eventosRoutes.get(
  "/dashboard",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  eventosController.list
);

eventosRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  eventosController.get
);

eventosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(eventoSchema),
  eventosController.create
);

eventosRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(eventoSchema),
  eventosController.update
);

eventosRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  eventosController.delete
);

export { eventosRoutes };
