"use strict";
// import { Router } from "express";
// import { DashboardController } from "./controller";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
// const dashboardRoutes = Router();
// const dashboardController =
//   new DashboardController();
// dashboardRoutes.get(
//   "/",
//   dashboardController.index
// );
// export { dashboardRoutes };
const express_1 = require("express");
const controller_1 = require("./controller");
const ensureAuthenticated_1 = require("../../shared/middlewares/ensureAuthenticated");
const ensureRole_1 = require("../../shared/middlewares/ensureRole");
const dashboardRoutes = (0, express_1.Router)();
exports.dashboardRoutes = dashboardRoutes;
const dashboardController = new controller_1.DashboardController();
dashboardRoutes.get("/", ensureAuthenticated_1.ensureAuthenticated, (0, ensureRole_1.ensureRole)(["ADMIN"]), dashboardController.resumo);
