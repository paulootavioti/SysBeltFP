import { Router } from "express";

import { CurriculosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";

const curriculosRoutes = Router();

const controller = new CurriculosController();

curriculosRoutes.post(
  "/",
  ensureAuthenticated,
  controller.create
);

curriculosRoutes.get(
  "/",
  ensureAuthenticated,
  controller.list
);

curriculosRoutes.get(
  "/:id",
  ensureAuthenticated,
  controller.show
);

curriculosRoutes.post(
  "/modulos",
  ensureAuthenticated,
  controller.createModulo
);

curriculosRoutes.post(
  "/aulas",
  ensureAuthenticated,
  controller.createAula
);

curriculosRoutes.post(
  "/tecnicas",
  ensureAuthenticated,
  controller.createTecnica
);

curriculosRoutes.put(
  "/modulos/:id",
  ensureAuthenticated,
  controller.updateModulo
);

curriculosRoutes.put(
  "/aulas/:id",
  ensureAuthenticated,
  controller.updateAula
);

curriculosRoutes.put(
  "/tecnicas/:id",
  ensureAuthenticated,
  controller.updateTecnica
);

curriculosRoutes.put(
  "/:id",
  ensureAuthenticated,
  controller.update
);

export { curriculosRoutes };