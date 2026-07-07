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
exports.RelatoriosController = void 0;
const RelatorioEvolucaoService_1 = require("./services/RelatorioEvolucaoService");
const RelatorioFinanceiroService_1 = require("./services/RelatorioFinanceiroService");
const RelatorioRankingService_1 = require("./services/RelatorioRankingService");
const RelatorioAniversariantesService_1 = require("./services/RelatorioAniversariantesService");
const RelatorioComportamentalService_1 = require("./services/RelatorioComportamentalService");
class RelatoriosController {
    evolucao(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { alunoId } = req.params;
            const service = new RelatorioEvolucaoService_1.RelatorioEvolucaoService();
            const relatorio = yield service.execute(Number(alunoId));
            return res.json(relatorio);
        });
    }
    financeiro(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new RelatorioFinanceiroService_1.RelatorioFinanceiroService();
            const relatorio = yield service.execute();
            return res.json(relatorio);
        });
    }
    ranking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new RelatorioRankingService_1.RelatorioRankingService();
            const relatorio = yield service.execute();
            return res.json(relatorio);
        });
    }
    aniversariantes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new RelatorioAniversariantesService_1.RelatorioAniversariantesService();
            const relatorio = yield service.execute();
            return res.json(relatorio);
        });
    }
    comportamental(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { alunoId } = req.params;
            const service = new RelatorioComportamentalService_1.RelatorioComportamentalService();
            const relatorio = yield service.execute(Number(alunoId));
            return res.json(relatorio);
        });
    }
}
exports.RelatoriosController = RelatoriosController;
