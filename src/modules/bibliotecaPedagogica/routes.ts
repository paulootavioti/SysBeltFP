import { Router } from "express";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { BibliotecaPedagogicaController } from "./controller";
import { conteudoTecnicoSchema, templatePlanejamentoSchema } from "./validation";

const routes = Router(); const controller = new BibliotecaPedagogicaController();
routes.get("/modalidades", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.modalidades);
routes.get("/conteudos", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.listar);
routes.post("/conteudos", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), validateBody(conteudoTecnicoSchema), controller.criar);
routes.post("/conteudos/:id/copiar", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.copiar);
routes.put("/conteudos/:id", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), validateBody(conteudoTecnicoSchema), controller.atualizar);
routes.get("/templates", ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR"]), controller.templates);
routes.post("/templates", ensureAuthenticated, ensureRole(["ADMIN"]), validateBody(templatePlanejamentoSchema), controller.criarTemplate);
export { routes as bibliotecaPedagogicaRoutes };
