import { Router } from "express";
import { FinanceiroController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const financeiroRoutes = Router();

const financeiroController = new FinanceiroController();

financeiroRoutes.get(
  "/resumo",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  financeiroController.resumo
);

export { financeiroRoutes };
