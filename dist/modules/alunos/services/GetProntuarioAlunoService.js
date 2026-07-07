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
exports.GetProntuarioAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class GetProntuarioAlunoService {
    execute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: {
                    id,
                },
                include: {
                    turma: true,
                    responsaveis: {
                        orderBy: {
                            nome: "asc",
                        },
                    },
                    mensalidades: {
                        orderBy: {
                            vencimento: "desc",
                        },
                    },
                    graduacoes: {
                        orderBy: {
                            data: "desc",
                        },
                    },
                    competicoes: {
                        include: {
                            competicao: true,
                        },
                    },
                    aulas: {
                        include: {
                            aula: {
                                include: {
                                    turma: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            });
            if (!aluno) {
                throw new AppError_1.AppError("Aluno não encontrado.");
            }
            const totalAulas = aluno.aulas.length;
            const totalPresencas = aluno.aulas.filter((registro) => registro.presente).length;
            const comportamento = {
                respeito: aluno.aulas.filter((aula) => aula.respeito).length,
                valentia: aluno.aulas.filter((aula) => aula.valentia).length,
                esforco: aluno.aulas.filter((aula) => aula.esforco).length,
                atencao: aluno.aulas.filter((aula) => aula.atencao).length,
                disciplina: aluno.aulas.filter((aula) => aula.disciplina).length,
            };
            const proximoGrauEm = totalPresencas === 0 ? 8 : 8 - (totalPresencas % 8);
            return {
                aluno,
                resumo: {
                    totalAulas,
                    totalPresencas,
                    frequencia: totalAulas > 0
                        ? Math.round((totalPresencas / totalAulas) * 100)
                        : 0,
                    faixa: aluno.faixa,
                    grau: aluno.grau,
                    proximoGrauEm: proximoGrauEm === 8 ? 8 : proximoGrauEm,
                },
                comportamento,
                responsaveis: aluno.responsaveis,
                turma: aluno.turma,
                historicoAulas: aluno.aulas,
                mensalidades: aluno.mensalidades,
                graduacoes: aluno.graduacoes,
                competicoes: aluno.competicoes,
            };
        });
    }
}
exports.GetProntuarioAlunoService = GetProntuarioAlunoService;
