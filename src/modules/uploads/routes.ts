import { Router } from "express";
import multer from "multer";

import { UploadsController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const uploadsRoutes = Router();

const controller = new UploadsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

uploadsRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  upload.single("arquivo"),
  controller.uploadFoto
);

uploadsRoutes.get(
  "/:prefixo/:arquivo",
  ensureAuthenticated,
  controller.getFoto
);

export { uploadsRoutes };
