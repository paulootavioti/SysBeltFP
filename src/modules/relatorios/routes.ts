import { Router } from "express";

import { RelatoriosController }
from "./controller";

import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const relatoriosRoutes =
  Router();

const relatoriosController =
  new RelatoriosController();

relatoriosRoutes.get(
  "/evolucao/:alunoId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  relatoriosController.evolucao
);

relatoriosRoutes.get(
  "/financeiro",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  relatoriosController.financeiro
);

relatoriosRoutes.get(
  "/ranking",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  relatoriosController.ranking
);

relatoriosRoutes.get(
  "/aniversariantes",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  relatoriosController.aniversariantes
);

relatoriosRoutes.get(
  "/comportamental/:alunoId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  relatoriosController.comportamental
);

export {
  relatoriosRoutes
};