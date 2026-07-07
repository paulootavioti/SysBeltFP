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
exports.VincularAlunoTurmaService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class VincularAlunoTurmaService {
    execute(turmaId, alunoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const turma = yield prisma_1.prisma.turma.findUnique({
                where: {
                    id: turmaId
                }
            });
            if (!turma) {
                throw new AppError_1.AppError("Turma não encontrada.");
            }
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: {
                    id: alunoId
                }
            });
            if (!aluno) {
                throw new AppError_1.AppError("Aluno não encontrado.");
            }
            return prisma_1.prisma.aluno.update({
                where: {
                    id: alunoId
                },
                data: {
                    turmaId
                }
            });
        });
    }
}
exports.VincularAlunoTurmaService = VincularAlunoTurmaService;
