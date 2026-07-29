import { Router } from "express";
import { ContratosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { ensureCronSecret } from "../../shared/middlewares/ensureCronSecret";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  contratoSchema,
  alterarSituacaoContratoSchema,
  registrarAssinaturaSchema,
  renovarContratoSchema,
} from "./validation";

const contratosRoutes = Router();

const contratosController = new ContratosController();

contratosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(contratoSchema),
  contratosController.create
);

contratosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  contratosController.list
);

contratosRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  contratosController.get
);

contratosRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(contratoSchema),
  contratosController.update
);

contratosRoutes.patch(
  "/:id/situacao",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(alterarSituacaoContratoSchema),
  contratosController.alterarSituacao
);

contratosRoutes.post(
  "/:id/assinar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(registrarAssinaturaSchema),
  contratosController.assinar
);

contratosRoutes.post(
  "/:id/renovar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(renovarContratoSchema),
  contratosController.renovar
);

contratosRoutes.post(
  "/renovar-vencidos",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  contratosController.renovarVencidosManual
);

contratosRoutes.post(
  "/renovar-vencidos/cron",
  ensureCronSecret,
  contratosController.renovarVencidosCron
);

export { contratosRoutes };
