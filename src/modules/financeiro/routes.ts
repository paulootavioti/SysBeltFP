import { Router } from "express";
import { FinanceiroController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const financeiroRoutes = Router();

const financeiroController = new FinanceiroController();

financeiroRoutes.get(
  "/resumo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.resumo
);

financeiroRoutes.get(
  "/contas-a-receber",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.contasAReceber
);

financeiroRoutes.get(
  "/contas-pagas",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.contasPagas
);

financeiroRoutes.get(
  "/contas-vencidas",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.contasVencidas
);

financeiroRoutes.get(
  "/canceladas",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.canceladas
);

financeiroRoutes.get(
  "/estornos",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.estornos
);

financeiroRoutes.get(
  "/fluxo-caixa",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.fluxoCaixa
);

financeiroRoutes.get(
  "/dashboard",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.dashboard
);

financeiroRoutes.get(
  "/exportar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  financeiroController.exportar
);

export { financeiroRoutes };
