import express from "express";
import cors from "cors";
import "dotenv/config";

import { alunosRoutes } from "./modules/alunos/routes";
import { responsaveisRoutes } from "./modules/responsaveis/routes";
import { mensalidadesRoutes } from "./modules/mensalidades/routes";
//import { presencasRoutes } from "./modules/presencas/routes";
import { graduacoesRoutes } from "./modules/graduacoes/routes";
import { competicoesRoutes } from "./modules/competicoes/routes";
import { dashboardRoutes } from "./modules/dashboard/routes";
import { financeiroRoutes } from "./modules/financeiro/routes";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { relatoriosRoutes } from "./modules/relatorios/routes";
import { comportamentosRoutes } from "./modules/comportamentos/routes";
import { turmasRoutes } from "./modules/turmas/routes";
import { authRoutes } from "./modules/auth/routes";
import { usuariosRoutes } from "./modules/usuarios/routes";
import { aulasRoutes } from "./modules/aulas/routes";
import { tecnicasRoutes } from "./modules/tecnicas/routes";
import { curriculosRoutes } from "./modules/curriculos/routes";
import { planosRoutes } from "./modules/planos/routes";
import { mensagensRoutes } from "./modules/mensagens/routes";
import { uploadsRoutes } from "./modules/uploads/routes";
import { avisosRoutes } from "./modules/avisos/routes";
import { unidadesRoutes } from "./modules/unidades/routes";
import { arenasRoutes } from "./modules/arenas/routes";
import { modalidadesRoutes } from "./modules/modalidades/routes";
import { metasRoutes } from "./modules/metas/routes";
import { eventosRoutes } from "./modules/eventos/routes";
import { formasPagamentoRoutes } from "./modules/formasPagamento/routes";
import { lojaRoutes } from "./modules/loja/routes";
import { fotosTreinoRoutes } from "./modules/fotosTreino/routes";
import { controleAcessoRoutes } from "./modules/controleAcesso/routes";
import { pagamentosRoutes } from "./modules/pagamentos/routes";
import { assinaturasRoutes } from "./modules/assinaturas/routes";
import { modelosContratoRoutes } from "./modules/modelosContrato/routes";
import { contratosRoutes } from "./modules/contratos/routes";
import { assinaturaEletronicaRoutes } from "./modules/assinaturaEletronica/routes";
import { notificacoesRoutes } from "./modules/notificacoes/routes";
import { portalFamiliaRoutes } from "./modules/portalFamilia/routes";
import { mensagensFamiliaRoutes } from "./modules/mensagensFamilia/routes";
import { publicoRoutes } from "./modules/publico/routes";
import { leadsRoutes } from "./modules/leads/routes";
import { portalProfessorRoutes } from "./modules/portalProfessor/routes";

// 5173 = sgcl-web (admin/staff), 5175 = sgcl-portal-familia (Portal da
// Família), 5176 = sgcl-portal-professor (Portal do Professor) — três
// frontends separados consumindo a mesma API.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:5175", "http://localhost:5176"];

export const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("REQ:", req.method, req.url);
    next();
  });
}

app.use(cors({
  origin: corsOrigin
}));

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    projeto: "Sys Belt - Sistema Faixa Preta",
    versao: "1.0.0",
  });
});

app.use("/alunos", alunosRoutes);
app.use("/responsaveis", responsaveisRoutes);
app.use("/mensalidades", mensalidadesRoutes);
//app.use("/presencas", presencasRoutes);
app.use("/graduacoes", graduacoesRoutes);
app.use("/competicoes", competicoesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/relatorios", relatoriosRoutes);
app.use("/comportamentos", comportamentosRoutes);
app.use("/turmas", turmasRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/aulas", aulasRoutes);
app.use("/tecnicas", tecnicasRoutes);
app.use("/curriculos", curriculosRoutes);
app.use("/planos", planosRoutes);
app.use("/mensagens", mensagensRoutes);
app.use("/uploads", uploadsRoutes);
app.use("/avisos", avisosRoutes);
app.use("/unidades", unidadesRoutes);
app.use("/arenas", arenasRoutes);
app.use("/modalidades", modalidadesRoutes);
app.use("/metas", metasRoutes);
app.use("/eventos", eventosRoutes);
app.use("/formas-pagamento", formasPagamentoRoutes);
app.use("/loja", lojaRoutes);
app.use("/fotos-treino", fotosTreinoRoutes);
app.use("/controle-acesso", controleAcessoRoutes);
app.use("/pagamentos", pagamentosRoutes);
app.use("/assinaturas", assinaturasRoutes);
app.use("/modelos-contrato", modelosContratoRoutes);
app.use("/contratos", contratosRoutes);
app.use("/assinatura-eletronica", assinaturaEletronicaRoutes);
app.use("/notificacoes", notificacoesRoutes);
app.use("/portal-familia", portalFamiliaRoutes);
app.use("/portal-professor", portalProfessorRoutes);
app.use("/mensagens-familia", mensagensFamiliaRoutes);
app.use("/publico", publicoRoutes);
app.use("/leads", leadsRoutes);

app.use("/auth", authRoutes);
app.use(errorHandler);
