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
exports.FinanceiroController = void 0;
const prisma_1 = require("../../shared/database/prisma");
class FinanceiroController {
    resumo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const recebidas = yield prisma_1.prisma.mensalidade.aggregate({
                where: {
                    pago: true
                },
                _sum: {
                    valor: true
                }
            });
            const pendentes = yield prisma_1.prisma.mensalidade.aggregate({
                where: {
                    pago: false
                },
                _sum: {
                    valor: true
                }
            });
            const inadimplentes = yield prisma_1.prisma.mensalidade.count({
                where: {
                    pago: false,
                    vencimento: {
                        lt: new Date()
                    }
                }
            });
            return res.json({
                totalRecebido: recebidas._sum.valor || 0,
                totalPendente: pendentes._sum.valor || 0,
                inadimplentes
            });
        });
    }
}
exports.FinanceiroController = FinanceiroController;
