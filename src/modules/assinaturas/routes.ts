import { Router } from "express";
import { AssinaturasController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { ensureCronSecret } from "../../shared/middlewares/ensureCronSecret";
import { validateBody } from "../../shared/middlewares/validateBody";
import { assinaturaSchema, alterarStatusAssinaturaSchema } from "./validation";

const assinaturasRoutes = Router();

const assinaturasController = new AssinaturasController();

assinaturasRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(assinaturaSchema),
  assinaturasController.create
);

assinaturasRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  assinaturasController.list
);

assinaturasRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(assinaturaSchema),
  assinaturasController.update
);

assinaturasRoutes.patch(
  "/:id/status",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(alterarStatusAssinaturaSchema),
  assinaturasController.alterarStatus
);

// disparo manual pelo ADMIN, escopado à própria unidade.
assinaturasRoutes.post(
  "/gerar-cobrancas",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  assinaturasController.gerarCobrancasManual
);

// disparo externo (cron), sem usuário autenticado, roda pra todas as
// unidades — ver src/shared/middlewares/ensureCronSecret.ts.
assinaturasRoutes.post(
  "/gerar-cobrancas/cron",
  ensureCronSecret,
  assinaturasController.gerarCobrancasCron
);

export { assinaturasRoutes };
