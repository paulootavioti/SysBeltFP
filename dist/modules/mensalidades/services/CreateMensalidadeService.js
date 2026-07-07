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
exports.CreateMensalidadeService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class CreateMensalidadeService {
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ valor, vencimento, alunoId }) {
            const dataVencimento = new Date(vencimento);
            const mes = dataVencimento.getMonth();
            const ano = dataVencimento.getFullYear();
            const mensalidadesAluno = yield prisma_1.prisma.mensalidade.findMany({
                where: {
                    alunoId
                }
            });
            const mensalidadeExistente = mensalidadesAluno.find(item => {
                const data = new Date(item.vencimento);
                return (data.getMonth() === mes &&
                    data.getFullYear() === ano);
            });
            if (mensalidadeExistente) {
                throw new AppError_1.AppError("Já existe uma mensalidade para este aluno neste mês.");
            }
            const mensalidade = yield prisma_1.prisma.mensalidade.create({
                data: {
                    valor,
                    vencimento: dataVencimento,
                    alunoId
                }
            });
            return mensalidade;
        });
    }
}
exports.CreateMensalidadeService = CreateMensalidadeService;
