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
exports.UpdateAulaAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class UpdateAulaAlunoService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const registro = yield prisma_1.prisma.aulaAluno.findUnique({
                where: {
                    id: data.id,
                },
                include: {
                    aula: true,
                },
            });
            if (!registro) {
                throw new AppError_1.AppError("Registro da aula não encontrado.");
            }
            if (registro.aula.status === "FINALIZADA") {
                throw new AppError_1.AppError("Não é possível alterar uma aula finalizada.");
            }
            return prisma_1.prisma.aulaAluno.update({
                where: {
                    id: data.id,
                },
                data: {
                    presente: data.presente,
                    respeito: data.respeito,
                    valentia: data.valentia,
                    esforco: data.esforco,
                    atencao: data.atencao,
                    disciplina: data.disciplina,
                    observacao: data.observacao,
                },
            });
        });
    }
}
exports.UpdateAulaAlunoService = UpdateAulaAlunoService;
