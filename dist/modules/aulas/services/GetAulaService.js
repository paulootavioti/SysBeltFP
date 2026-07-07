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
exports.GetAulaService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class GetAulaService {
    execute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const aula = yield prisma_1.prisma.aula.findUnique({
                where: {
                    id,
                },
                include: {
                    turma: true,
                    alunos: {
                        include: {
                            aluno: true,
                        },
                        orderBy: {
                            aluno: {
                                nome: "asc",
                            },
                        },
                    },
                },
            });
            if (!aula) {
                throw new AppError_1.AppError("Aula não encontrada.");
            }
            return aula;
        });
    }
}
exports.GetAulaService = GetAulaService;
