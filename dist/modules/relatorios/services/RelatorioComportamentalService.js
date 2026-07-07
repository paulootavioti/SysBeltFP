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
exports.RelatorioComportamentalService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class RelatorioComportamentalService {
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
            const registros = yield prisma_1.prisma.comportamento.findMany({
                where: {
                    alunoId
                }
            });
            const resumo = registros.reduce((acc, item) => {
                acc.respeito += item.respeito;
                acc.valentia += item.valentia;
                acc.esforco += item.esforco;
                acc.atencao += item.atencao;
                acc.disciplina += item.disciplina;
                return acc;
            }, {
                respeito: 0,
                valentia: 0,
                esforco: 0,
                atencao: 0,
                disciplina: 0
            });
            const ranking = [
                {
                    nome: "Respeito",
                    valor: resumo.respeito
                },
                {
                    nome: "Valentia",
                    valor: resumo.valentia
                },
                {
                    nome: "Esforço",
                    valor: resumo.esforco
                },
                {
                    nome: "Atenção",
                    valor: resumo.atencao
                },
                {
                    nome: "Disciplina",
                    valor: resumo.disciplina
                }
            ].sort((a, b) => b.valor - a.valor);
            return {
                aluno: aluno.nome,
                mensagem: `
📋 RELATÓRIO COMPORTAMENTAL

🥋 Aluno: ${aluno.nome}
🏅 Faixa: ${aluno.faixa}

🔵 Respeito: ${resumo.respeito}
🟢 Valentia: ${resumo.valentia}
🟠 Esforço: ${resumo.esforco}
🟡 Atenção: ${resumo.atencao}
🔴 Disciplina: ${resumo.disciplina}

⭐ Destaque:
${ranking[0].nome}

Parabéns pela evolução!

Equipe Cia de Lutas Weberty Viana
      `.trim()
            };
        });
    }
}
exports.RelatorioComportamentalService = RelatorioComportamentalService;
