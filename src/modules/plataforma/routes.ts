import { Router } from "express";

import { PlataformaController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureCronSecret } from "../../shared/middlewares/ensureCronSecret";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import {
  alterarAssinaturaSchema,
  criarContaSchema,
  planoPlataformaSchema,
} from "./validation";

const plataformaRoutes = Router();

const controller = new PlataformaController();
const administracaoLegadaHabilitada = process.env.LEGACY_PLATFORM_ADMIN_ENABLED === "true";

// Fechamento mensal por disparo externo (cron). Fica antes do
// `ensureAuthenticated` porque se autentica por segredo compartilhado —
// ver src/shared/middlewares/ensureCronSecret.ts.
if (administracaoLegadaHabilitada) {
  plataformaRoutes.post("/faturas/fechamento/cron", ensureCronSecret, controller.fechamentoCron);
}

plataformaRoutes.use(ensureAuthenticated);

// ---- dono da academia: a própria assinatura, resolvida pela unidade ativa
plataformaRoutes.get(
  "/minha-assinatura",
  ensureRole(["ADMIN"]),
  controller.minhaAssinatura
);

// ---- operador do SaaS ----
//
// Tudo daqui pra baixo administra a VENDA da plataforma (planos, contas de
// outros clientes, faturamento) e por isso é exclusivo de SUPERADMIN. Note
// que `ensureRole` já deixa SUPERADMIN passar em qualquer rota; listar o
// perfil explicitamente aqui é o que BARRA o ADMIN de uma academia.
if (administracaoLegadaHabilitada) {
plataformaRoutes.get("/planos", ensureRole(["SUPERADMIN"]), controller.listarPlanos);

plataformaRoutes.post(
  "/planos",
  ensureRole(["SUPERADMIN"]),
  validateBody(planoPlataformaSchema),
  controller.criarPlano
);

plataformaRoutes.put(
  "/planos/:id",
  ensureRole(["SUPERADMIN"]),
  validateBody(planoPlataformaSchema),
  controller.atualizarPlano
);

plataformaRoutes.get("/contas", ensureRole(["SUPERADMIN"]), controller.listarContas);

plataformaRoutes.get(
  "/contas/:contaId",
  ensureRole(["SUPERADMIN"]),
  controller.detalharConta
);

plataformaRoutes.post(
  "/contas",
  ensureRole(["SUPERADMIN"]),
  validateBody(criarContaSchema),
  controller.criarConta
);

plataformaRoutes.patch(
  "/contas/:contaId/assinatura",
  ensureRole(["SUPERADMIN"]),
  validateBody(alterarAssinaturaSchema),
  controller.alterarAssinatura
);

plataformaRoutes.post(
  "/faturas/fechamento",
  ensureRole(["SUPERADMIN"]),
  controller.fechamentoManual
);

plataformaRoutes.patch(
  "/faturas/:id/pago",
  ensureRole(["SUPERADMIN"]),
  controller.marcarFaturaPaga
);
}

export { plataformaRoutes };
