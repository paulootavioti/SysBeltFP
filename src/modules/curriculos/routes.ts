import { Router } from "express";
import multer from "multer";

import { CurriculosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  curriculoSchema,
  moduloCurriculoSchema,
  aulaCurriculoSchema,
  aulaAssistidaSchema,
  tecnicaCurriculoSchema,
  itemCatalogoPedagogicoSchema,
  curriculoImportacaoSchema,
  matrizPlanejamentoImportacaoSchema,
} from "./validation";

const curriculosRoutes = Router();

const controller = new CurriculosController();
const uploadMatriz = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

curriculosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(curriculoSchema),
  controller.create
);
curriculosRoutes.get("/exportar-matriz-arquivo", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.exportMatrixFile);
curriculosRoutes.post("/importar-matriz-arquivo", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), uploadMatriz.single("arquivo"), controller.importMatrixFile);

curriculosRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  controller.list
);

curriculosRoutes.get("/catalogo-pedagogico", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.listCatalogo);
curriculosRoutes.post("/catalogo-pedagogico", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), validateBody(itemCatalogoPedagogicoSchema), controller.createCatalogo);
curriculosRoutes.delete("/catalogo-pedagogico/:id", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.deleteCatalogo);

curriculosRoutes.post(
  "/importar",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(curriculoImportacaoSchema),
  controller.import
);

curriculosRoutes.get("/exportar-matriz", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.exportMatrix);
curriculosRoutes.post(
  "/importar-matriz",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(matrizPlanejamentoImportacaoSchema),
  controller.importMatrix
);

curriculosRoutes.get("/:id/exportar", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.export);

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
  "/aulas/assistida",
  ensureAuthenticated,
  ensureRole(["ADMIN", "PROFESSOR"]),
  validateBody(aulaAssistidaSchema),
  controller.createAulaAssistida
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

curriculosRoutes.post("/aulas/:id/duplicar", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.duplicateAula);

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
