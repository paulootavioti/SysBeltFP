import { Router } from "express";

import { ModalidadesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { criarModalidadeSchema, atualizarModalidadeSchema } from "./validation";

const modalidadesRoutes = Router();

const modalidadesController = new ModalidadesController();

modalidadesRoutes.use(ensureAuthenticated);

// PROFESSOR também lê: a modalidade aparece na turma e no planejamento.
modalidadesRoutes.get(
  "/",
  ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]),
  modalidadesController.list
);

modalidadesRoutes.post(
  "/",
  ensureRole(["ADMIN"]),
  validateBody(criarModalidadeSchema),
  modalidadesController.create
);

modalidadesRoutes.put(
  "/:id",
  ensureRole(["ADMIN"]),
  validateBody(atualizarModalidadeSchema),
  modalidadesController.update
);

modalidadesRoutes.patch(
  "/:id/ativo",
  ensureRole(["ADMIN"]),
  modalidadesController.toggleAtivo
);

export { modalidadesRoutes };
