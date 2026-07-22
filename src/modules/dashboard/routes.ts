// import { Router } from "express";
// import { DashboardController } from "./controller";

// const dashboardRoutes = Router();

// const dashboardController =
//   new DashboardController();

// dashboardRoutes.get(
//   "/",
//   dashboardController.index
// );

// export { dashboardRoutes };

import { Router } from "express";
import { DashboardController } from "./controller";

import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const dashboardRoutes = Router();

const dashboardController =
  new DashboardController();

dashboardRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  dashboardController.resumo
);

dashboardRoutes.get(
  "/periodo",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  dashboardController.resumoPeriodo
);

export { dashboardRoutes };