import { Router } from "express";
import { MensalidadesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  mensalidadeSchema,
  cancelarMensalidadeSchema,
  estornarMensalidadeSchema,
  pagarMensalidadeSchema,
  registrarComprovanteSchema,
} from "./validation";

const mensalidadesRoutes = Router();

const mensalidadesController =
  new MensalidadesController();

mensalidadesRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(mensalidadeSchema),
  mensalidadesController.create
);

mensalidadesRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  mensalidadesController.list
);

mensalidadesRoutes.get(
  "/vencidas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  mensalidadesController.vencidas
);

mensalidadesRoutes.get(
  "/aluno/:alunoId/historico",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  mensalidadesController.historicoAluno
);

mensalidadesRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  mensalidadesController.get
);

mensalidadesRoutes.patch(
  "/:id/pagar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(pagarMensalidadeSchema),
  mensalidadesController.pagar
);

mensalidadesRoutes.patch(
  "/:id/cancelar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(cancelarMensalidadeSchema),
  mensalidadesController.cancelar
);

mensalidadesRoutes.patch(
  "/:id/estornar",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(estornarMensalidadeSchema),
  mensalidadesController.estornar
);

mensalidadesRoutes.post(
  "/:id/comprovante",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(registrarComprovanteSchema),
  mensalidadesController.registrarComprovante
);

export { mensalidadesRoutes };
