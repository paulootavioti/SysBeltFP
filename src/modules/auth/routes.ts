import { Router } from "express";
import { AuthController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { rateLimitLogin } from "../../shared/middlewares/rateLimitLogin";
import { registerSchema, loginDoisFatoresSchema, loginSchema, redefinirSenhaSchema, solicitarRedefinicaoSenhaSchema } from "./validation";
import { rateLimitRecuperacaoSenha } from "../../shared/middlewares/rateLimitRecuperacaoSenha";
const authRoutes = Router();
const authController = new AuthController();
authRoutes.post(
  "/register",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(registerSchema),
  authController.register
);
authRoutes.post("/login", rateLimitLogin, validateBody(loginSchema), authController.login);
authRoutes.post(
  "/login/2fa",
  rateLimitLogin,
  validateBody(loginDoisFatoresSchema),
  authController.concluirLoginDoisFatores,
);
authRoutes.post(
  "/senha/solicitar",
  rateLimitRecuperacaoSenha,
  validateBody(solicitarRedefinicaoSenhaSchema),
  authController.solicitarRedefinicaoSenha,
);
authRoutes.post(
  "/senha/redefinir",
  rateLimitRecuperacaoSenha,
  validateBody(redefinirSenhaSchema),
  authController.redefinirSenha,
);
export { authRoutes };
