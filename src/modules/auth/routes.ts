import { Router } from "express";
import { AuthController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { registerSchema, loginSchema } from "./validation";
const authRoutes = Router();
const authController = new AuthController();
authRoutes.post(
  "/register",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  validateBody(registerSchema),
  authController.register
);
authRoutes.post("/login", validateBody(loginSchema), authController.login);
export { authRoutes };
