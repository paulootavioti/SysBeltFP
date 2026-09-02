import { Router } from "express";

import { PortalFamiliaController } from "./controller";
import { ensureAuthenticatedFamilia } from "./middlewares/ensureAuthenticatedFamilia";
import { validateBody } from "../../shared/middlewares/validateBody";
import { rateLimitLogin } from "../../shared/middlewares/rateLimitLogin";
import { rateLimitRecuperacaoSenha } from "../../shared/middlewares/rateLimitRecuperacaoSenha";
import {
  loginFamiliaSchema,
  pagarMensalidadeFamiliaSchema,
  enviarMensagemFamiliaSchema,
  criarPedidoFamiliaSchema,
  redefinirSenhaFamiliaSchema,
  solicitarRedefinicaoSenhaFamiliaSchema,
  alterarSenhaFamiliaSchema,
  pagarPedidoFamiliaSchema,
} from "./validation";

const portalFamiliaRoutes = Router();

const controller = new PortalFamiliaController();

portalFamiliaRoutes.post("/login", rateLimitLogin, validateBody(loginFamiliaSchema), controller.login);
portalFamiliaRoutes.post(
  "/senha/solicitar",
  rateLimitRecuperacaoSenha,
  validateBody(solicitarRedefinicaoSenhaFamiliaSchema),
  controller.solicitarRedefinicaoSenha,
);

portalFamiliaRoutes.post(
  "/loja/pedidos/:id/pagar",
  ensureAuthenticatedFamilia,
  validateBody(pagarPedidoFamiliaSchema),
  controller.pagarPedido
);
portalFamiliaRoutes.post(
  "/senha/redefinir",
  rateLimitRecuperacaoSenha,
  validateBody(redefinirSenhaFamiliaSchema),
  controller.redefinirSenha,
);

portalFamiliaRoutes.get("/alunos", ensureAuthenticatedFamilia, controller.listarAlunos);

portalFamiliaRoutes.patch(
  "/conta/senha",
  ensureAuthenticatedFamilia,
  validateBody(alterarSenhaFamiliaSchema),
  controller.alterarSenha
);

portalFamiliaRoutes.get("/resumo/:alunoId", ensureAuthenticatedFamilia, controller.resumo);
portalFamiliaRoutes.get(
  "/privacidade/:alunoId/consentimentos",
  ensureAuthenticatedFamilia,
  controller.listarConsentimentos
);
portalFamiliaRoutes.patch(
  "/privacidade/consentimentos/:id/revogar",
  ensureAuthenticatedFamilia,
  controller.revogarConsentimento
);

portalFamiliaRoutes.get("/frequencia/:alunoId", ensureAuthenticatedFamilia, controller.frequencia);

portalFamiliaRoutes.get("/mensalidades/:alunoId", ensureAuthenticatedFamilia, controller.mensalidades);

portalFamiliaRoutes.post(
  "/mensalidades/:id/pagar",
  ensureAuthenticatedFamilia,
  validateBody(pagarMensalidadeFamiliaSchema),
  controller.pagarMensalidade
);

portalFamiliaRoutes.get("/agenda/:alunoId", ensureAuthenticatedFamilia, controller.agenda);

portalFamiliaRoutes.get("/contratos/:alunoId", ensureAuthenticatedFamilia, controller.contratos);

portalFamiliaRoutes.get("/mensagens/:alunoId", ensureAuthenticatedFamilia, controller.listarMensagens);

portalFamiliaRoutes.get("/mensagens-nao-lidas", ensureAuthenticatedFamilia, controller.mensagensNaoLidas);

portalFamiliaRoutes.post(
  "/mensagens",
  ensureAuthenticatedFamilia,
  validateBody(enviarMensagemFamiliaSchema),
  controller.enviarMensagem
);

portalFamiliaRoutes.get("/loja/:alunoId", ensureAuthenticatedFamilia, controller.loja);

portalFamiliaRoutes.post(
  "/loja/pedidos",
  ensureAuthenticatedFamilia,
  validateBody(criarPedidoFamiliaSchema),
  controller.criarPedido
);

portalFamiliaRoutes.get("/loja/pedidos/:alunoId", ensureAuthenticatedFamilia, controller.listarPedidos);

export { portalFamiliaRoutes };
