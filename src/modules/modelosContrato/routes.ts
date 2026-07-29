import { Router } from "express";
import { ModelosContratoController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { modeloContratoSchema } from "./validation";

const modelosContratoRoutes = Router();

const modelosContratoController = new ModelosContratoController();

modelosContratoRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(modeloContratoSchema),
  modelosContratoController.create
);

modelosContratoRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  modelosContratoController.list
);

modelosContratoRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(modeloContratoSchema),
  modelosContratoController.update
);

modelosContratoRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  modelosContratoController.toggleAtivo
);

modelosContratoRoutes.post(
  "/:id/versionar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  modelosContratoController.versionar
);

modelosContratoRoutes.post(
  "/:id/clonar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  modelosContratoController.clonar
);

export { modelosContratoRoutes };
