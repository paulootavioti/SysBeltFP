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
exports.RelatorioFinanceiroService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class RelatorioFinanceiroService {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const mensalidadesVencidas = yield prisma_1.prisma.mensalidade.findMany({
                where: {
                    pago: false,
                    vencimento: {
                        lt: new Date()
                    }
                },
                include: {
                    aluno: true
                },
                orderBy: {
                    vencimento: "asc"
                }
            });
            const totalEmAberto = mensalidadesVencidas.reduce((total, mensalidade) => total + mensalidade.valor, 0);
            const linhas = mensalidadesVencidas.map(mensalidade => {
                const data = new Date(mensalidade.vencimento)
                    .toLocaleDateString("pt-BR");
                return `• ${mensalidade.aluno.nome} - R$ ${mensalidade.valor.toFixed(2)} - venc. ${data}`;
            });
            return {
                totalAlunosInadimplentes: mensalidadesVencidas.length,
                totalEmAberto,
                mensagem: `
📋 RELATÓRIO FINANCEIRO

Mensalidades vencidas: ${mensalidadesVencidas.length}
Total em aberto: R$ ${totalEmAberto.toFixed(2)}

${linhas.length > 0 ? linhas.join("\n") : "Nenhuma mensalidade vencida encontrada."}

Equipe Cia de Lutas Weberty Viana
      `.trim()
            };
        });
    }
}
exports.RelatorioFinanceiroService = RelatorioFinanceiroService;
