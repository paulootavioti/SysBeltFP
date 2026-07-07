"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comportamentosRoutes = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const ensureAuthenticated_1 = require("../../shared/middlewares/ensureAuthenticated");
const ensureRole_1 = require("../../shared/middlewares/ensureRole");
const comportamentosRoutes = (0, express_1.Router)();
exports.comportamentosRoutes = comportamentosRoutes;
const comportamentosController = new controller_1.ComportamentosController();
comportamentosRoutes.post("/", ensureAuthenticated_1.ensureAuthenticated, (0, ensureRole_1.ensureRole)([
    "ADMIN",
    "PROFESSOR"
]), comportamentosController.create);
comportamentosRoutes.get("/", ensureAuthenticated_1.ensureAuthenticated, (0, ensureRole_1.ensureRole)(["ADMIN", "PROFESSOR"]), comportamentosController.list);
comportamentosRoutes.get("/resumo/:alunoId", ensureAuthenticated_1.ensureAuthenticated, (0, ensureRole_1.ensureRole)(["ADMIN", "PROFESSOR"]), comportamentosController.resumo);
