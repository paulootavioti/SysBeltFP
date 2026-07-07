"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const routes_1 = require("./modules/alunos/routes");
const routes_2 = require("./modules/responsaveis/routes");
const routes_3 = require("./modules/mensalidades/routes");
//import { presencasRoutes } from "./modules/presencas/routes";
const routes_4 = require("./modules/graduacoes/routes");
const routes_5 = require("./modules/competicoes/routes");
const routes_6 = require("./modules/dashboard/routes");
const routes_7 = require("./modules/financeiro/routes");
const errorHandler_1 = require("./shared/middlewares/errorHandler");
const routes_8 = require("./modules/relatorios/routes");
const routes_9 = require("./modules/comportamentos/routes");
const routes_10 = require("./modules/turmas/routes");
const routes_11 = require("./modules/auth/routes");
const routes_12 = require("./modules/usuarios/routes");
const routes_13 = require("./modules/aulas/routes");
const routes_14 = require("./modules/tecnicas/routes");
const routes_15 = require("./modules/curriculos/routes");
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log("REQ:", req.method, req.url);
    next();
});
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173"
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    console.log("Entrou na rota raiz");
    return res.json({
        projeto: "SGCL",
        versao: "1.0.0",
    });
});
app.use("/alunos", routes_1.alunosRoutes);
app.use("/responsaveis", routes_2.responsaveisRoutes);
app.use("/mensalidades", routes_3.mensalidadesRoutes);
//app.use("/presencas", presencasRoutes);
app.use("/graduacoes", routes_4.graduacoesRoutes);
app.use("/competicoes", routes_5.competicoesRoutes);
app.use("/dashboard", routes_6.dashboardRoutes);
app.use("/financeiro", routes_7.financeiroRoutes);
app.use("/relatorios", routes_8.relatoriosRoutes);
app.use("/comportamentos", routes_9.comportamentosRoutes);
app.use("/turmas", routes_10.turmasRoutes);
app.use("/usuarios", routes_12.usuariosRoutes);
app.use("/aulas", routes_13.aulasRoutes);
app.use("/tecnicas", routes_14.tecnicasRoutes);
app.use("/curriculos", routes_15.curriculosRoutes);
app.use("/auth", routes_11.authRoutes);
app.use(errorHandler_1.errorHandler);
app.listen(3333, () => {
    console.log("Servidor rodando na porta 3333");
});
