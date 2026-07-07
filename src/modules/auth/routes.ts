import { Router } from "express";
import { AuthController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
const authRoutes = Router();
const authController = new AuthController();
authRoutes.post(
  "/register",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  authController.register
);
authRoutes.post("/login", authController.login);
export { authRoutes };