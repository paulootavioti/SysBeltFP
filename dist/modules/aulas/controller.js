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
exports.AulasController = void 0;
const StartAulaService_1 = require("./services/StartAulaService");
const ListAulasService_1 = require("./services/ListAulasService");
const GetAulaService_1 = require("./services/GetAulaService");
const FinalizarAulaService_1 = require("./services/FinalizarAulaService");
const UpdateAulaAlunoService_1 = require("./services/UpdateAulaAlunoService");
class AulasController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new StartAulaService_1.StartAulaService();
            const aula = yield service.execute(req.body);
            return res.status(201).json(aula);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListAulasService_1.ListAulasService();
            const aulas = yield service.execute();
            return res.json(aulas);
        });
    }
    show(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new GetAulaService_1.GetAulaService();
            const aula = yield service.execute(Number(req.params.id));
            return res.json(aula);
        });
    }
    finalizar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new FinalizarAulaService_1.FinalizarAulaService();
            const aula = yield service.execute(Number(req.params.id));
            return res.json(aula);
        });
    }
    updateAluno(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new UpdateAulaAlunoService_1.UpdateAulaAlunoService();
            const registro = yield service.execute(Object.assign({ id: Number(req.params.id) }, req.body));
            return res.json(registro);
        });
    }
}
exports.AulasController = AulasController;
