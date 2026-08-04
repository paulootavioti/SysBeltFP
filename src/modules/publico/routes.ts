import { Router } from "express";

import { PublicoController } from "./controller";
import { validateBody } from "../../shared/middlewares/validateBody";
import { criarLeadPublicoSchema } from "./validation";
import { rateLimitLeads } from "./middlewares/rateLimitLeads";

// Módulo sem autenticação — consumido pelo site estático da landing page
// (landing-academia/), sempre escopado pela unidade fixa configurada em
// UNIDADE_PUBLICA_ID (ver src/shared/utils/unidadePublica.ts).
const publicoRoutes = Router();

const publicoController = new PublicoController();

publicoRoutes.get("/modalidades", publicoController.modalidades);

publicoRoutes.get("/equipe", publicoController.equipe);

publicoRoutes.get("/horarios", publicoController.horarios);

publicoRoutes.get("/produtos-destaque", publicoController.produtosDestaque);

publicoRoutes.get("/galeria", publicoController.galeria);

publicoRoutes.post(
  "/leads",
  rateLimitLeads,
  validateBody(criarLeadPublicoSchema),
  publicoController.criarLead
);

export { publicoRoutes };
