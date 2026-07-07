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
exports.GetEvolucaoAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class GetEvolucaoAlunoService {
    execute(alunoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: {
                    id: alunoId
                }
            });
            if (!aluno) {
                throw new AppError_1.AppError("Aluno não encontrado.");
            }
            const presencas = yield prisma_1.prisma.aulaAluno.count({
                where: {
                    alunoId,
                    presente: true,
                },
            });
            const aulasPorGrau = 8;
            const grausPorFaixa = 4;
            const aulasPorFaixa = aulasPorGrau * grausPorFaixa;
            const grauCalculado = Math.floor(presencas / aulasPorGrau) % grausPorFaixa;
            const aulasNaFaixaAtual = presencas % aulasPorFaixa;
            const faltamParaProximoGrau = aulasPorGrau - (presencas % aulasPorGrau);
            const faltamParaProximaFaixa = aulasPorFaixa - aulasNaFaixaAtual;
            return {
                alunoId: aluno.id,
                nome: aluno.nome,
                faixaAtual: aluno.faixa,
                grauAtual: aluno.grau,
                grauCalculado,
                presencas,
                faltamParaProximoGrau: faltamParaProximoGrau === 8 ? 0 : faltamParaProximoGrau,
                faltamParaProximaFaixa: faltamParaProximaFaixa === 32 ? 0 : faltamParaProximaFaixa
            };
        });
    }
}
exports.GetEvolucaoAlunoService = GetEvolucaoAlunoService;
