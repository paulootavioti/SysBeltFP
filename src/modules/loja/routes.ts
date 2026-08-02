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

export { lojaRoutes };
