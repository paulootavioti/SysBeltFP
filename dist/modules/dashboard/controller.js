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
exports.DashboardController = void 0;
const prisma_1 = require("../../shared/database/prisma");
class DashboardController {
    resumo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const alunosAtivos = yield prisma_1.prisma.aluno.count({
                where: {
                    ativo: true
                }
            });
            const responsaveis = yield prisma_1.prisma.responsavel.count();
            const mensalidadesPendentes = yield prisma_1.prisma.mensalidade.count({
                where: {
                    pago: false
                }
            });
            const mensalidadesVencidas = yield prisma_1.prisma.mensalidade.count({
                where: {
                    pago: false,
                    vencimento: {
                        lt: new Date()
                    }
                }
            });
            const recebido = yield prisma_1.prisma.mensalidade.aggregate({
                where: {
                    pago: true
                },
                _sum: {
                    valor: true
                }
            });
            const pendente = yield prisma_1.prisma.mensalidade.aggregate({
                where: {
                    pago: false
                },
                _sum: {
                    valor: true
                }
            });
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);
            const presencasHoje = yield prisma_1.prisma.aulaAluno.count({
                where: {
                    createdAt: {
                        gte: hoje,
                        lt: amanha
                    }
                }
            });
            const graduacoes = yield prisma_1.prisma.graduacao.count();
            const competicoes = yield prisma_1.prisma.competicao.count();
            return res.json({
                alunosAtivos,
                responsaveis,
                mensalidadesPendentes,
                mensalidadesVencidas,
                totalRecebido: recebido._sum.valor || 0,
                totalPendente: pendente._sum.valor || 0,
                presencasHoje,
                graduacoes,
                competicoes
            });
        });
    }
}
exports.DashboardController = DashboardController;
