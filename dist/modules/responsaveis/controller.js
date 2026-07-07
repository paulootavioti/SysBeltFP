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
exports.ResponsaveisController = void 0;
const CreateResponsavelService_1 = require("./services/CreateResponsavelService");
const ListResponsaveisService_1 = require("./services/ListResponsaveisService");
const GetResponsavelService_1 = require("./services/GetResponsavelService");
const UpdateResponsavelService_1 = require("./services/UpdateResponsavelService");
const ToggleResponsavelAtivoService_1 = require("./services/ToggleResponsavelAtivoService");
const DeleteResponsavelService_1 = require("./services/DeleteResponsavelService");
const ListResponsaveisByAlunoService_1 = require("./services/ListResponsaveisByAlunoService");
class ResponsaveisController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new CreateResponsavelService_1.CreateResponsavelService();
            const responsavel = yield service.execute(req.body);
            return res.status(201).json(responsavel);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListResponsaveisService_1.ListResponsaveisService();
            const responsaveis = yield service.execute();
            return res.json(responsaveis);
        });
    }
    show(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new GetResponsavelService_1.GetResponsavelService();
            const responsavel = yield service.execute(Number(id));
            return res.json(responsavel);
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new UpdateResponsavelService_1.UpdateResponsavelService();
            const responsavel = yield service.execute(Object.assign({ id: Number(id) }, req.body));
            return res.json(responsavel);
        });
    }
    toggleAtivo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new ToggleResponsavelAtivoService_1.ToggleResponsavelAtivoService();
            const responsavel = yield service.execute(Number(id));
            return res.json(responsavel);
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new DeleteResponsavelService_1.DeleteResponsavelService();
            yield service.execute(Number(id));
            return res.status(204).send();
        });
    }
    listByAluno(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { alunoId } = req.params;
            const service = new ListResponsaveisByAlunoService_1.ListResponsaveisByAlunoService();
            const responsaveis = yield service.execute(Number(alunoId));
            return res.json(responsaveis);
        });
    }
}
exports.ResponsaveisController = ResponsaveisController;
