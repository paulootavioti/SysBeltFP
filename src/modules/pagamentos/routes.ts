import { Router } from "express";
import { PagamentosController } from "./controller";

const pagamentosRoutes = Router();

const pagamentosController = new PagamentosController();

// Webhooks de gateway não carregam o JWT da aplicação — a autenticação é
// por assinatura/segredo do próprio gateway, verificada dentro do
// controller, não por `ensureAuthenticated`.
//
// A forma com `:formaPagamentoId` é a que vale num sistema com vários
// assinantes: a URL diz de quem é a notificação, e com isso o servidor
// sabe qual segredo usar pra conferir a assinatura. Cada academia
// cadastra a SUA URL no painel do gateway.
pagamentosRoutes.post("/webhook/:gateway/:formaPagamentoId", pagamentosController.webhook);

// Sem id: instalação de uma academia só, ainda com as credenciais em
// variável de ambiente. Mantida pra não quebrar quem já configurou.
pagamentosRoutes.post("/webhook/:gateway", pagamentosController.webhook);

export { pagamentosRoutes };
