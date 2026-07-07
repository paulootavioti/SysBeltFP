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
exports.TurmasController = void 0;
const CreateTurmaService_1 = require("./services/CreateTurmaService");
const ListTurmasService_1 = require("./services/ListTurmasService");
const VincularAlunoTurmaService_1 = require("./services/VincularAlunoTurmaService");
const GetTurmaDetalhadaService_1 = require("./services/GetTurmaDetalhadaService");
class TurmasController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateTurmaService_1.CreateTurmaService();
            const turma = yield service.execute(req.body);
            return res.status(201).json(turma);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListTurmasService_1.ListTurmasService();
            const turmas = yield service.execute();
            return res.json(turmas);
        });
    }
    show(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new GetTurmaDetalhadaService_1.GetTurmaDetalhadaService();
            const turma = yield service.execute(Number(id));
            return res.json(turma);
        });
    }
    vincularAluno(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { turmaId, alunoId } = req.params;
            const service = new VincularAlunoTurmaService_1.VincularAlunoTurmaService();
            const aluno = yield service.execute(Number(turmaId), Number(alunoId));
            return res.json(aluno);
        });
    }
}
exports.TurmasController = TurmasController;
