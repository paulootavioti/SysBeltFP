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
exports.MensalidadesController = void 0;
const CreateMensalidadeService_1 = require("./services/CreateMensalidadeService");
const ListMensalidadesService_1 = require("./services/ListMensalidadesService");
const GetMensalidadesVencidasService_1 = require("./services/GetMensalidadesVencidasService");
const PagarMensalidadeService_1 = require("./services/PagarMensalidadeService");
class MensalidadesController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateMensalidadeService_1.CreateMensalidadeService();
            const mensalidade = yield service.execute(Object.assign(Object.assign({}, req.body), { valor: Number(req.body.valor), alunoId: Number(req.body.alunoId) }));
            return res.status(201).json(mensalidade);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListMensalidadesService_1.ListMensalidadesService();
            const mensalidades = yield service.execute();
            return res.json(mensalidades);
        });
    }
    // Mensalidades Vencidas
    vencidas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new GetMensalidadesVencidasService_1.GetMensalidadesVencidasService();
            const mensalidades = yield service.execute();
            return res.json(mensalidades);
        });
    }
    // Marcar Mensalidade como Paga
    pagar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new PagarMensalidadeService_1.PagarMensalidadeService();
            const mensalidade = yield service.execute(Number(id));
            return res.json(mensalidade);
        });
    }
}
exports.MensalidadesController = MensalidadesController;
