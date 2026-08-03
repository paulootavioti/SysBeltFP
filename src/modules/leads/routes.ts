import { Router } from "express";

import { LeadsController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { atualizarStatusLeadSchema } from "./validation";

const leadsRoutes = Router();

const leadsController = new LeadsController();

leadsRoutes.use(ensureAuthenticated, ensureRole(["ADMIN", "RECEPCAO"]));

leadsRoutes.get("/", leadsController.list);

leadsRoutes.patch("/:id/status", validateBody(atualizarStatusLeadSchema), leadsController.atualizarStatus);

export { leadsRoutes };
