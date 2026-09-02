import { Router } from "express";
import { AlunosController } from "./controller";
import { ensureAuthenticated } from "../../shared/middlewares/ensureAuthenticated";
import { ensureRole } from "../../shared/middlewares/ensureRole";
import { validateBody } from "../../shared/middlewares/validateBody";
import { alunoSchema, senhaPortalSchema } from "./validation";
import multer from "multer";

const alunosRoutes = Router();

const alunosController =
  new AlunosController();

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, arquivo, callback) => {
    const valido = arquivo.mimetype === "text/csv" || arquivo.originalname.toLowerCase().endsWith(".csv");
    if (!valido) return callback(new Error("Envie um arquivo CSV."));
    return callback(null, true);
  },
});

alunosRoutes.post(
  "/importacoes/previsualizar",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  uploadCsv.single("arquivo"),
  alunosController.previsualizarImportacao,
);

alunosRoutes.post(
  "/importacoes/confirmar",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  uploadCsv.single("arquivo"),
  alunosController.importarCsv,
);

alunosRoutes.post(
  "/importacoes/:id/desfazer",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  alunosController.desfazerImportacao,
);


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

  alunosRoutes.patch(
    "/:id/senha-portal",
    ensureAuthenticated,
    ensureRole(["ADMIN"]),
    validateBody(senhaPortalSchema),
    alunosController.setSenhaPortal
  );

  
// temporariamente comentado
// alunosRoutes.get(
//   "/aniversariantes",
//   alunosController.aniversariantes
// );


export { alunosRoutes };
