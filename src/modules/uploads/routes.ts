import { Router } from "express";
import multer from "multer";

import { UploadsController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureFotoAutorizada } from "../../shared/middlewares/ensureFotoAutorizada";
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

// aceita URL assinada (usada por <img>) ou header Authorization — ver
// ensureFotoAutorizada.
uploadsRoutes.get(
  "/:prefixo/:arquivo",
  ensureFotoAutorizada,
  controller.getFoto
);

export { uploadsRoutes };
