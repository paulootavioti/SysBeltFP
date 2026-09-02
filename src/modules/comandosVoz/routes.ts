import { Router } from "express";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { ComandosVozController } from "./controller";
import { comandoVozSchema, executarSkillSchema, parearArenaSchema, testarComandoSchema } from "./validation";

const controller = new ComandosVozController();
export const comandosVozRoutes = Router();
comandosVozRoutes.use(ensureAuthenticated, ensureRole(["ADMIN"]));
comandosVozRoutes.get("/", controller.listar);
comandosVozRoutes.post("/", validateBody(comandoVozSchema), controller.criar);
comandosVozRoutes.put("/:id", validateBody(comandoVozSchema), controller.atualizar);
comandosVozRoutes.post("/:id/testar", validateBody(testarComandoSchema), controller.testar);
comandosVozRoutes.post("/pareamentos", validateBody(parearArenaSchema), controller.parear);

export const skillVozRoutes = Router();
skillVozRoutes.post("/:token", validateBody(executarSkillSchema), controller.skill);
