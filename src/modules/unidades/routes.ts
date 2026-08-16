import { Router } from "express";
import { UnidadesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { unidadeSchema } from "./validation";

const unidadesRoutes = Router();

const unidadesController = new UnidadesController();

unidadesRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["DONO", "ADMIN"]),
  validateBody(unidadeSchema),
  unidadesController.create
);

unidadesRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["DONO", "ADMIN"]),
  unidadesController.list
);

// versão enxuta (id/nome), pra ADMIN/PROFESSOR popularem o seletor de
// consulta de grade horária de outra unidade — não expõe dados completos.
unidadesRoutes.get(
  "/opcoes",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  unidadesController.listarOpcoes
);

unidadesRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["DONO", "ADMIN"]),
  validateBody(unidadeSchema),
  unidadesController.update
);

unidadesRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["DONO", "ADMIN"]),
  unidadesController.toggleAtivo
);

export { unidadesRoutes };
