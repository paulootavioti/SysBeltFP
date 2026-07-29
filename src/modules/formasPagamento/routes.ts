import { Router } from "express";
import { FormasPagamentoController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { formaPagamentoSchema } from "./validation";

const formasPagamentoRoutes = Router();

const formasPagamentoController = new FormasPagamentoController();

formasPagamentoRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(formaPagamentoSchema),
  formasPagamentoController.create
);

formasPagamentoRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  formasPagamentoController.list
);

formasPagamentoRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(formaPagamentoSchema),
  formasPagamentoController.update
);

formasPagamentoRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  formasPagamentoController.toggleAtivo
);

export { formasPagamentoRoutes };
