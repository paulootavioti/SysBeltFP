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
exports.AtualizarEvolucaoAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const faixasKids = [
    "Branca",
    "Cinza e Branca",
    "Cinza",
    "Cinza e Preta",
    "Amarela e Branca",
    "Amarela",
    "Amarela e Preta",
    "Laranja e Branca",
    "Laranja",
    "Laranja e Preta",
    "Verde"
];
class AtualizarEvolucaoAlunoService {
    execute(alunoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: {
                    id: alunoId
                }
            });
            if (!aluno) {
                return null;
            }
            const totalPresencas = yield prisma_1.prisma.aulaAluno.count({
                where: {
                    alunoId,
                    presente: true,
                },
            });
            const aulasPorGrau = 8;
            const grausPorFaixa = 4;
            const aulasPorFaixa = aulasPorGrau * grausPorFaixa;
            const novoGrau = Math.floor(totalPresencas / aulasPorGrau) % grausPorFaixa;
            let novaFaixa = aluno.faixa || "Branca";
            const deveTrocarFaixa = totalPresencas > 0 &&
                totalPresencas % aulasPorFaixa === 0;
            if (deveTrocarFaixa) {
                const indiceAtual = faixasKids.indexOf(novaFaixa);
                if (indiceAtual >= 0 &&
                    indiceAtual < faixasKids.length - 1) {
                    novaFaixa =
                        faixasKids[indiceAtual + 1];
                    yield prisma_1.prisma.graduacao.create({
                        data: {
                            alunoId,
                            faixa: novaFaixa,
                            data: new Date()
                        }
                    });
                }
            }
            const alunoAtualizado = yield prisma_1.prisma.aluno.update({
                where: {
                    id: alunoId
                },
                data: {
                    grau: novoGrau,
                    faixa: novaFaixa
                }
            });
            return {
                aluno: alunoAtualizado,
                totalPresencas,
                novoGrau,
                novaFaixa
            };
        });
    }
}
exports.AtualizarEvolucaoAlunoService = AtualizarEvolucaoAlunoService;
