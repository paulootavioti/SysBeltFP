"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlunosController = void 0;
const CreateAlunoService_1 = require("./services/CreateAlunoService");
const ListAlunosService_1 = require("./services/ListAlunosService");
const ListAniversariantesService_1 = require("./services/ListAniversariantesService");
const GetProntuarioAlunoService_1 = require("./services/GetProntuarioAlunoService");
const UpdateAlunoService_1 = require("./services/UpdateAlunoService");
const ToggleAlunoAtivoService_1 = require("./services/ToggleAlunoAtivoService");
const GetAlunoCompletoService_1 = require("./services/GetAlunoCompletoService");
class AlunosController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateAlunoService_1.CreateAlunoService();
            const aluno = yield service.execute(req.body);
            return res.status(201).json(aluno);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListAlunosService_1.ListAlunosService();
            const alunos = yield service.execute();
            return res.json(alunos);
        });
    }
    //Aniverriantes
    aniversariantes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListAniversariantesService_1.ListAniversariantesService();
            const alunos = yield service.execute();
            return res.json(alunos);
        });
    }
    prontuario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new GetProntuarioAlunoService_1.GetProntuarioAlunoService();
            const prontuario = yield service.execute(Number(id));
            return res.json(prontuario);
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new UpdateAlunoService_1.UpdateAlunoService();
            const aluno = yield service.execute(Object.assign({ id: Number(id) }, req.body));
            return res.json(aluno);
        });
    }
    toggleAtivo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new ToggleAlunoAtivoService_1.ToggleAlunoAtivoService();
            const aluno = yield service.execute(Number(id));
            return res.json(aluno);
        });
    }
    show(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new GetAlunoCompletoService_1.GetAlunoCompletoService();
            const aluno = yield service.execute(Number(id));
            return res.json(aluno);
        });
    }
}
exports.AlunosController = AlunosController;
