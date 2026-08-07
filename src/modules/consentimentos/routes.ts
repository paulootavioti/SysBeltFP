import { Router } from "express";

import { ConsentimentosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { registrarConsentimentoSchema } from "./validation";

const consentimentosRoutes = Router();

const controller = new ConsentimentosController();

consentimentosRoutes.use(ensureAuthenticated);

// Consentimento é documento de conformidade: quem cadastra aluno na
// recepção também o coleta. PROFESSOR não entra — não é papel dele.
consentimentosRoutes.post(
  "/",
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(registrarConsentimentoSchema),
  controller.registrar
);

consentimentosRoutes.patch(
  "/:id/revogar",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.revogar
);

consentimentosRoutes.get(
  "/aluno/:alunoId",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.historicoDoAluno
);

consentimentosRoutes.get(
  "/aluno/:alunoId/situacao",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.situacaoDoAluno
);

export { consentimentosRoutes };
