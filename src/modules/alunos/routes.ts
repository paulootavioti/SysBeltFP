import { Router } from "express";
import { AlunosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { alunoSchema } from "./validation";

const alunosRoutes = Router();

const alunosController =
  new AlunosController();


  alunosRoutes.post(
    "/",
    ensureAuthenticated,
    ensureRole(["ADMIN", "RECEPCAO"]),
    validateBody(alunoSchema),
    alunosController.create
  );
  
  alunosRoutes.get(
    "/",
    ensureAuthenticated,
    ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
    alunosController.list
  );
  
  // só é usado pela tela de Relatórios, que PROFESSOR não acessa mais —
  // e o retorno inclui dataNascimento, fora do recorte permitido a ele.
  alunosRoutes.get(
    "/aniversariantes",
    ensureAuthenticated,
    ensureRole(["ADMIN", "RECEPCAO"]),
    alunosController.aniversariantes
  );

  // prontuário é a ficha completa do aluno (contato/endereço/financeiro) —
  // PROFESSOR só enxerga o recorte pedagógico (nome, apelido, responsável,
  // turma, presenças, graduações) e só das próprias turmas, ver
  // GetProntuarioAlunoService.
  alunosRoutes.get(
    "/:id/prontuario",
    ensureAuthenticated,
    ensureRole(["ADMIN", "RECEPCAO", "PROFESSOR"]),
    alunosController.prontuario
  );
  
  alunosRoutes.get(
    "/:id",
    ensureAuthenticated,
    ensureRole(["ADMIN", "PROFESSOR", "RECEPCAO"]),
    alunosController.show
  );
  
  alunosRoutes.put(
    "/:id",
    ensureAuthenticated,
    ensureRole(["ADMIN", "RECEPCAO"]),
    validateBody(alunoSchema),
    alunosController.update
  );
  
  alunosRoutes.patch(
    "/:id/ativo",
    ensureAuthenticated,
    ensureRole(["ADMIN", "RECEPCAO"]),
    alunosController.toggleAtivo
  );

  
// temporariamente comentado
// alunosRoutes.get(
//   "/aniversariantes",
//   alunosController.aniversariantes
// );


export { alunosRoutes };