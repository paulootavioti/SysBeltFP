import { Router } from "express";

import { UsuariosController } from "./controller";

import { ensureAuthenticated }
from "../../shared/middlewares/ensureAuthenticated";

import { ensureRole }
from "../../shared/middlewares/ensureRole";

import { validateBody } from "../../shared/middlewares/validateBody";
import { confirmarDoisFatoresSchema, desativarDoisFatoresSchema, updatePerfilSchema, updateUsuarioSchema } from "./validation";

const usuariosRoutes =
  Router();

const usuariosController =
  new UsuariosController();

usuariosRoutes.get("/minha-seguranca", ensureAuthenticated, usuariosController.obterMinhaSeguranca);
usuariosRoutes.post("/minha-seguranca/2fa/iniciar", ensureAuthenticated, usuariosController.iniciarDoisFatores);
usuariosRoutes.post(
  "/minha-seguranca/2fa/confirmar",
  ensureAuthenticated,
  validateBody(confirmarDoisFatoresSchema),
  usuariosController.confirmarDoisFatores,
);
usuariosRoutes.post(
  "/minha-seguranca/2fa/desativar",
  ensureAuthenticated,
  validateBody(desativarDoisFatoresSchema),
  usuariosController.desativarDoisFatores,
);

usuariosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  usuariosController.list
);

// versão enxuta (id/nome/apelido) dos professores da unidade — usada pelo
// seletor de professor substituto na transferência de aula.
usuariosRoutes.get(
  "/professores",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  usuariosController.listarProfessores
);

// unidades vinculadas ao usuário autenticado — usada pelo seletor de
// "unidade ativa" de quem está vinculado a mais de uma unidade.
usuariosRoutes.get(
  "/minhas-unidades",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  usuariosController.listarMinhasUnidades
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
