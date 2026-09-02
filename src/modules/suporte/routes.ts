import { Router } from "express";

import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { validateBody } from "../../shared/middlewares/validateBody";
import { SuporteController } from "./controller";
import { criarSolicitacaoSuporteSchema } from "./validation";

const suporteRoutes = Router();
const controller = new SuporteController();

suporteRoutes.post("/", ensureAuthenticated, validateBody(criarSolicitacaoSuporteSchema), controller.criar);

export { suporteRoutes };
