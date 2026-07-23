import { Router } from "express";

import { UsuariosController } from "./controller";

import { ensureAuthenticated }
from "../../shared/middlewares/ensureAuthenticated";

import { ensureRole }
from "../../shared/middlewares/ensureRole";

import { validateBody } from "../../shared/middlewares/validateBody";
import { updatePerfilSchema, updateUsuarioSchema } from "./validation";

const usuariosRoutes =
  Router();

const usuariosController =
  new UsuariosController();

usuariosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  usuariosController.list
);

usuariosRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(updateUsuarioSchema),
  usuariosController.update
);

usuariosRoutes.patch(
  "/:id/perfil",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(updatePerfilSchema),
  usuariosController.updatePerfil
);

usuariosRoutes.patch(
  "/:id/ativo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  usuariosController.toggleAtivo
);

export {
  usuariosRoutes
};