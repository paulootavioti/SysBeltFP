import { Router } from "express";
import { validateBody } from "../../shared/middlewares/validateBody";
import { criarLeadPublicoSchema } from "./validation";
import { CaptacaoPublicaController } from "./publicController";
import { rateLimitCaptacaoPorIp, rateLimitCaptacaoPorTelefone } from "./middlewares/rateLimitCaptacao";

const captacaoPublicaRoutes = Router();
const controller = new CaptacaoPublicaController();

captacaoPublicaRoutes.get("/:slug", controller.obter);
captacaoPublicaRoutes.post(
  "/:slug/leads",
  rateLimitCaptacaoPorIp,
  validateBody(criarLeadPublicoSchema),
  rateLimitCaptacaoPorTelefone,
  controller.criar,
);

export { captacaoPublicaRoutes };
