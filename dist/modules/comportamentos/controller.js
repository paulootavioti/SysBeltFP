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
exports.ComportamentosController = void 0;
const CreateComportamentoService_1 = require("./services/CreateComportamentoService");
const ListComportamentosService_1 = require("./services/ListComportamentosService");
const GetResumoComportamentalService_1 = require("./services/GetResumoComportamentalService");
class ComportamentosController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateComportamentoService_1.CreateComportamentoService();
            const comportamento = yield service.execute(Object.assign(Object.assign({}, req.body), { alunoId: Number(req.body.alunoId) }));
            return res.status(201).json(comportamento);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListComportamentosService_1.ListComportamentosService();
            const comportamentos = yield service.execute();
            return res.json(comportamentos);
        });
    }
    resumo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { alunoId } = req.params;
            const service = new GetResumoComportamentalService_1.GetResumoComportamentalService();
            const resumo = yield service.execute(Number(alunoId));
            return res.json(resumo);
        });
    }
}
exports.ComportamentosController = ComportamentosController;
