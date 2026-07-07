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
exports.GetResumoComportamentalService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class GetResumoComportamentalService {
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
            return Object.assign({ aluno: aluno.nome, faixa: aluno.faixa }, resumo);
        });
    }
}
exports.GetResumoComportamentalService = GetResumoComportamentalService;
