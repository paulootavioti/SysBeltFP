import { Router } from "express";

import { CurriculosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  curriculoSchema,
  moduloCurriculoSchema,
  aulaCurriculoSchema,
  tecnicaCurriculoSchema,
} from "./validation";

const curriculosRoutes = Router();

const controller = new CurriculosController();

curriculosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(curriculoSchema),
  controller.create
);

curriculosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  controller.list
);

curriculosRoutes.get(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  controller.show
);

curriculosRoutes.post(
  "/modulos",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(moduloCurriculoSchema),
  controller.createModulo
);

curriculosRoutes.post(
  "/aulas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(aulaCurriculoSchema),
  controller.createAula
);

curriculosRoutes.post(
  "/tecnicas",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(tecnicaCurriculoSchema),
  controller.createTecnica
);

curriculosRoutes.put(
  "/modulos/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(moduloCurriculoSchema),
  controller.updateModulo
);

curriculosRoutes.put(
  "/aulas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(aulaCurriculoSchema),
  controller.updateAula
);

curriculosRoutes.put(
  "/tecnicas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(tecnicaCurriculoSchema),
  controller.updateTecnica
);

curriculosRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(curriculoSchema),
  controller.update
);

curriculosRoutes.delete(
  "/modulos/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.deleteModulo
);

curriculosRoutes.delete(
  "/aulas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.deleteAula
);

curriculosRoutes.delete(
  "/tecnicas/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.deleteTecnica
);

curriculosRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  controller.delete
);

export { curriculosRoutes };
