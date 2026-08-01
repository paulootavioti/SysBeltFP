import { Router } from "express";
import { GraduacoesController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  graduacaoSchema,
  incrementarGrauSchema,
  solicitarGraduacaoSchema,
  rejeitarGraduacaoSchema,
} from "./validation";

const graduacoesRoutes = Router();

const graduacoesController =
  new GraduacoesController();

// promoção direta e imediata — só o ADMIN aplica sem passar por aprovação.
// O PROFESSOR usa POST /solicitar, que cria um pedido pendente.
graduacoesRoutes.post("/",
ensureAuthenticated,
ensureRole(["ADMIN"]),
validateBody(graduacaoSchema),
 graduacoesController.create);

graduacoesRoutes.post("/solicitar",
ensureAuthenticated,
ensureRole(["PROFESSOR"]),
validateBody(solicitarGraduacaoSchema),
 graduacoesController.solicitar);

graduacoesRoutes.patch("/:id/aprovar",
ensureAuthenticated,
ensureRole(["ADMIN"]),
 graduacoesController.aprovar);

graduacoesRoutes.patch("/:id/rejeitar",
ensureAuthenticated,
ensureRole(["ADMIN"]),
validateBody(rejeitarGraduacaoSchema),
 graduacoesController.rejeitar);

graduacoesRoutes.post("/grau",
ensureAuthenticated,
ensureRole(["ADMIN", "PROFESSOR"]),
validateBody(incrementarGrauSchema),
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