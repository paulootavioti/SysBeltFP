import { Router } from "express";
import { MensagensController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const mensagensRoutes = Router();

const controller = new MensagensController();

const perfisPermitidos = ["ADMIN", "RECEPCAO"];

mensagensRoutes.get(
  "/lembrete-semanal",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.lembreteSemanal
);

mensagensRoutes.get(
  "/lembrete-vencimento",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.lembreteVencimento
);

mensagensRoutes.get(
  "/lembrete-atraso",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.lembreteAtraso
);

mensagensRoutes.get(
  "/relatorio-mensal",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.relatorioMensal
);

mensagensRoutes.get(
  "/congratulacoes-graduacao",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.congratulacoesGraduacao
);

mensagensRoutes.get(
  "/ausencia",
  ensureAuthenticated,
  ensureRole(perfisPermitidos),
  controller.ausencia
);

export { mensagensRoutes };
