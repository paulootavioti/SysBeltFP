import { Router } from "express";

import { LeadsController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { agendarExperimentalSchema, atualizarEstagioLeadSchema, canalCaptacaoSchema, converterLeadSchema } from "./validation";

const leadsRoutes = Router();

const leadsController = new LeadsController();

leadsRoutes.use(ensureAuthenticated);

leadsRoutes.get("/", ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]), leadsController.list);

leadsRoutes.get("/canais", ensureRole(["ADMIN", "RECEPCAO"]), leadsController.listarCanais);
leadsRoutes.post("/canais", ensureRole(["ADMIN", "RECEPCAO"]), validateBody(canalCaptacaoSchema), leadsController.criarCanal);
leadsRoutes.put("/canais/:id", ensureRole(["ADMIN", "RECEPCAO"]), validateBody(canalCaptacaoSchema), leadsController.atualizarCanal);
leadsRoutes.post("/:id/converter", ensureRole(["ADMIN", "RECEPCAO"]), validateBody(converterLeadSchema), leadsController.converter);
leadsRoutes.post("/:id/experimental", ensureRole(["ADMIN", "RECEPCAO"]), validateBody(agendarExperimentalSchema), leadsController.agendarExperimental);
leadsRoutes.post("/:id/estagio", ensureRole(["ADMIN", "RECEPCAO"]), validateBody(atualizarEstagioLeadSchema), leadsController.atualizarEstagio);

export { leadsRoutes };
