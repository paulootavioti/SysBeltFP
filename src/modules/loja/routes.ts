import { Router } from "express";
import { LojaController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { produtoSchema } from "./validation";

const lojaRoutes = Router();

const lojaController = new LojaController();

lojaRoutes.use(ensureAuthenticated, ensureRole(["ADMIN"]));

lojaRoutes.get("/kpis", lojaController.kpis);

lojaRoutes.get("/produtos", lojaController.list);

lojaRoutes.post("/produtos", validateBody(produtoSchema), lojaController.create);

lojaRoutes.put("/produtos/:id", validateBody(produtoSchema), lojaController.update);

lojaRoutes.patch("/produtos/:id/ativo", lojaController.toggleAtivo);

lojaRoutes.get("/pedidos", lojaController.listPedidos);

lojaRoutes.patch("/pedidos/:id/entregar", lojaController.marcarPedidoEntregue);

lojaRoutes.patch("/pedidos/:id/cancelar", lojaController.cancelarPedido);

export { lojaRoutes };
