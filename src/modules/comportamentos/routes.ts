import { Router } from "express";
import { ComportamentosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { comportamentoSchema } from "./validation";

const comportamentosRoutes =
  Router();

const comportamentosController =
  new ComportamentosController();

comportamentosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole([
    "ADMIN",
    "PROFESSOR"
  ]),
  validateBody(comportamentoSchema),
  comportamentosController.create
);

comportamentosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  comportamentosController.list
);

comportamentosRoutes.get(
  "/resumo/:alunoId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  comportamentosController.resumo
);

export {
  comportamentosRoutes
};