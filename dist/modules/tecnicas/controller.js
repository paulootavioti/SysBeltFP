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
exports.TecnicasController = void 0;
const CreateTecnicaService_1 = require("./services/CreateTecnicaService");
const ListTecnicasService_1 = require("./services/ListTecnicasService");
class TecnicasController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateTecnicaService_1.CreateTecnicaService();
            const tecnica = yield service.execute(req.body);
            return res.status(201).json(tecnica);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListTecnicasService_1.ListTecnicasService();
            const tecnicas = yield service.execute();
            return res.json(tecnicas);
        });
    }
}
exports.TecnicasController = TecnicasController;
