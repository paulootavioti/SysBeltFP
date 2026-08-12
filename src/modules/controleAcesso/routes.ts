import { Router } from "express";

import { ControleAcessoController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { credencialAcessoSchema, dispositivoAcessoSchema } from "./validation";
import { exigirRecursoTenant } from "../concessaoPlataforma/exigirRecursoTenant";

const controleAcessoRoutes = Router();
const controller = new ControleAcessoController();

// ===== Rotas do equipamento =====
// A catraca não faz login: autentica-se pelo id + header
// `x-dispositivo-segredo`, definido no cadastro do dispositivo. Por isso
// ficam ANTES do ensureAuthenticated.
controleAcessoRoutes.post("/dispositivos/:id/autorizar", controller.autorizar);
controleAcessoRoutes.post("/dispositivos/:id/eventos", controller.receberEvento);

// ===== Rotas da equipe =====
controleAcessoRoutes.use(ensureAuthenticated);
controleAcessoRoutes.use(exigirRecursoTenant("CONTROLE_ACESSO"));

controleAcessoRoutes.get(
  "/dispositivos",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.listarDispositivos
);

controleAcessoRoutes.post(
  "/dispositivos",
  ensureRole(["ADMIN"]),
  validateBody(dispositivoAcessoSchema),
  controller.criarDispositivo
);

controleAcessoRoutes.post(
  "/credenciais",
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(credencialAcessoSchema),
  controller.criarCredencial
);

controleAcessoRoutes.patch(
  "/credenciais/:id/revogar",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.revogarCredencial
);

controleAcessoRoutes.get(
  "/eventos",
  ensureRole(["ADMIN", "RECEPCAO"]),
  controller.listarEventos
);

export { controleAcessoRoutes };
