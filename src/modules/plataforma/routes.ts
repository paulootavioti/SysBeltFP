import { Router } from "express";

import { PlataformaController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";

const plataformaRoutes = Router();
const controller = new PlataformaController();

// O Tenant Plane expõe somente a visão da própria academia. Planos,
// assinantes, cobrança e fechamento pertencem ao Control Plane.
plataformaRoutes.use(ensureAuthenticated);
plataformaRoutes.get("/minha-assinatura", ensureRole(["ADMIN"]), controller.minhaAssinatura);

export { plataformaRoutes };
