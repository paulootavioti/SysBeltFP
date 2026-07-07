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
exports.RelatorioEvolucaoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class RelatorioEvolucaoService {
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
                }
            });
            const faltamParaProximoGrau = 8 - (presencas % 8);
            return {
                aluno: aluno.nome,
                faixa: aluno.faixa,
                grau: aluno.grau,
                presencas,
                mensagem: `
📋 RELATÓRIO DE EVOLUÇÃO

🥋 Aluno: ${aluno.nome}

🏅 Faixa Atual: ${aluno.faixa}
⭐ Grau Atual: ${aluno.grau}

📆 Presenças Registradas: ${presencas}

🎯 Faltam ${faltamParaProximoGrau === 8
                    ? 0
                    : faltamParaProximoGrau} aulas para o próximo grau.

Parabéns pelo comprometimento!

Equipe Cia de Lutas Weberty Viana
      `.trim()
            };
        });
    }
}
exports.RelatorioEvolucaoService = RelatorioEvolucaoService;
