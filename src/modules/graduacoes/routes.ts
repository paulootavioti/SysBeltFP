import { Router } from "express";
import { GraduacoesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const graduacoesRoutes = Router();

const graduacoesController =
  new GraduacoesController();

graduacoesRoutes.post("/",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR"]),
 graduacoesController.create);

graduacoesRoutes.post("/grau",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR"]),
 graduacoesController.incrementarGrau);

graduacoesRoutes.get("/",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
 graduacoesController.list);

graduacoesRoutes.get("/aluno/:id",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
 graduacoesController.aluno);

graduacoesRoutes.get("/proximas",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
 graduacoesController.proximas);

graduacoesRoutes.get("/evolucao/:alunoId",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
 graduacoesController.evolucao);

export { graduacoesRoutes };