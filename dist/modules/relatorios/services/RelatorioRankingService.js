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
exports.RelatorioRankingService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class RelatorioRankingService {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const ranking = yield prisma_1.prisma.aulaAluno.groupBy({
                by: ["alunoId"],
                where: {
                    presente: true,
                },
                _count: {
                    alunoId: true,
                },
                orderBy: {
                    _count: {
                        alunoId: "desc",
                    },
                },
            });
            const resultado = yield Promise.all(ranking.map((item, index) => __awaiter(this, void 0, void 0, function* () {
                const aluno = yield prisma_1.prisma.aluno.findUnique({
                    where: {
                        id: item.alunoId
                    }
                });
                return {
                    posicao: index + 1,
                    nome: aluno === null || aluno === void 0 ? void 0 : aluno.nome,
                    faixa: aluno === null || aluno === void 0 ? void 0 : aluno.faixa,
                    presencas: item._count.alunoId
                };
            })));
            const linhas = resultado.map(item => `${item.posicao}º - ${item.nome} | ${item.faixa} | ${item.presencas} presenças`);
            return {
                ranking: resultado,
                mensagem: `
🏆 RANKING DE FREQUÊNCIA

${linhas.join("\n")}

Parabéns aos alunos pela dedicação!

Equipe Cia de Lutas Weberty Viana
      `.trim()
            };
        });
    }
}
exports.RelatorioRankingService = RelatorioRankingService;
