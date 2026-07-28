import { Router } from "express";
import { ArenasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { criarArenaSchema, atualizarArenaSchema } from "./validation";

const arenasRoutes = Router();

const arenasController = new ArenasController();

arenasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(criarArenaSchema),
  arenasController.create
);

arenasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  arenasController.list
);

arenasRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(atualizarArenaSchema),
  arenasController.update
);

arenasRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  arenasController.toggleAtivo
);

export { arenasRoutes };
