import { Router } from "express";
import { AvisosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { reconhecerAvisosSchema } from "./validation";

const avisosRoutes = Router();

const avisosController = new AvisosController();

const perfisPermitidos = ["ADMIN", "RECEPCAO"];

avisosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  avisosController.list
);

avisosRoutes.post(
  "/reconhecer",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  validateBody(reconhecerAvisosSchema),
  avisosController.reconhecer
);

export { avisosRoutes };
