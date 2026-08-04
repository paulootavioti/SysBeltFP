import { Router } from "express";
import multer from "multer";

import { PortalProfessorController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  marcarPresencaSchema,
  marcarTecnicaSchema,
  criarNotaAulaSchema,
  registrarObservacaoAulaSchema,
  finalizarAulaProfessorSchema,
  publicarFotoAulaProfessorSchema,
} from "./validation";

const portalProfessorRoutes = Router();
const controller = new PortalProfessorController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// professor já é um Usuario (perfil PROFESSOR) — reaproveita o login e o
// middleware de autenticação existentes, sem stack de auth paralelo (ao
// contrário do Portal da Família, onde Responsavel/Aluno não são Usuario).
// ADMIN também acessa, pra suporte/teste.
portalProfessorRoutes.use(ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]));

portalProfessorRoutes.get("/hoje", controller.hoje);
portalProfessorRoutes.get("/aulas/:id", controller.aula);
portalProfessorRoutes.post("/aulas/:id/presenca", validateBody(marcarPresencaSchema), controller.presenca);
portalProfessorRoutes.post("/aulas/:id/tecnicas", validateBody(marcarTecnicaSchema), controller.tecnicas);
portalProfessorRoutes.post("/aulas/:id/notas", validateBody(criarNotaAulaSchema), controller.notas);
portalProfessorRoutes.post("/aulas/:id/observacao", validateBody(registrarObservacaoAulaSchema), controller.observacao);
portalProfessorRoutes.post(
  "/aulas/:id/foto",
  upload.single("arquivo"),
  validateBody(publicarFotoAulaProfessorSchema),
  controller.foto
);
portalProfessorRoutes.post(
  "/aulas/:id/finalizar",
  validateBody(finalizarAulaProfessorSchema),
  controller.finalizar
);

export { portalProfessorRoutes };
