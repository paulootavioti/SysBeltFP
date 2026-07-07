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
exports.CurriculosController = void 0;
const CreateCurriculoService_1 = require("./services/CreateCurriculoService");
const ListCurriculosService_1 = require("./services/ListCurriculosService");
const GetCurriculoService_1 = require("./services/GetCurriculoService");
class CurriculosController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateCurriculoService_1.CreateCurriculoService();
            const curriculo = yield service.execute(req.body);
            return res.status(201).json(curriculo);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListCurriculosService_1.ListCurriculosService();
            const curriculos = yield service.execute();
            return res.json(curriculos);
        });
    }
    show(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new GetCurriculoService_1.GetCurriculoService();
            const curriculo = yield service.execute(Number(req.params.id));
            return res.json(curriculo);
        });
    }
}
exports.CurriculosController = CurriculosController;
