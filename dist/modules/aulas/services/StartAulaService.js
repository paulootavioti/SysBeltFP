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
exports.StartAulaService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class StartAulaService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const turma = yield prisma_1.prisma.turma.findUnique({
                where: {
                    id: data.turmaId,
                },
                include: {
                    alunos: {
                        where: {
                            ativo: true,
                        },
                        orderBy: {
                            nome: "asc",
                        },
                    },
                },
            });
            if (!turma) {
                throw new AppError_1.AppError("Turma não encontrada.");
            }
            if (turma.alunos.length === 0) {
                throw new AppError_1.AppError("Não existem alunos ativos nesta turma.");
            }
            const aulaAberta = yield prisma_1.prisma.aula.findFirst({
                where: {
                    turmaId: data.turmaId,
                    status: "ABERTA",
                },
            });
            if (aulaAberta) {
                throw new AppError_1.AppError("Já existe uma aula aberta para esta turma.");
            }
            const aula = yield prisma_1.prisma.aula.create({
                data: {
                    data: new Date(),
                    turmaId: data.turmaId,
                    professor: data.professor,
                    observacoes: data.observacoes,
                    status: "ABERTA",
                    alunos: {
                        create: turma.alunos.map((aluno) => ({
                            alunoId: aluno.id,
                            presente: false,
                        })),
                    },
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
            return aula;
        });
    }
}
exports.StartAulaService = StartAulaService;
