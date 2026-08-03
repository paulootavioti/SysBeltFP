import { Router } from "express";
import { FotosTreinoController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { publicarFotosTreinoSchema } from "./validation";

const fotosTreinoRoutes = Router();

const fotosTreinoController = new FotosTreinoController();

fotosTreinoRoutes.use(ensureAuthenticated, ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]));

fotosTreinoRoutes.get("/", fotosTreinoController.list);

fotosTreinoRoutes.post("/", validateBody(publicarFotosTreinoSchema), fotosTreinoController.publicar);

fotosTreinoRoutes.patch("/:id/visibilidade", fotosTreinoController.toggleVisibilidade);

fotosTreinoRoutes.delete("/:id", fotosTreinoController.excluir);

export { fotosTreinoRoutes };
