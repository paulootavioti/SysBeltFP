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
exports.GraduacoesController = void 0;
const prisma_1 = require("../../shared/database/prisma");
const CreateGraduacaoService_1 = require("./services/CreateGraduacaoService");
const GetEvolucaoAlunoService_1 = require("./services/GetEvolucaoAlunoService");
class GraduacoesController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { faixa, data, alunoId } = req.body;
            const service = new CreateGraduacaoService_1.CreateGraduacaoService();
            const graduacao = yield service.execute({
                faixa,
                data,
                alunoId: Number(alunoId)
            });
            return res.status(201).json(graduacao);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const graduacoes = yield prisma_1.prisma.graduacao.findMany({
                include: {
                    aluno: true
                },
                orderBy: {
                    data: "desc"
                }
            });
            return res.json(graduacoes);
        });
    }
    // Historico de Graduacoes
    aluno(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const graduacoes = yield prisma_1.prisma.graduacao.findMany({
                where: {
                    alunoId: Number(id)
                },
                orderBy: {
                    data: "desc"
                }
            });
            return res.json(graduacoes);
        });
    }
    // Proximas Graduacoes
    // async proximas(req: Request, res: Response) {
    //   const alunos = await prisma.aluno.findMany({
    //     where: {
    //       ativo: true
    //     }
    //   });
    //   const resultado = await Promise.all(
    //     alunos.map(async (aluno) => {
    //       const presencas =
    //         await prisma.presenca.count({
    //           where: {
    //             alunoId: aluno.id
    //           }
    //         });
    //       return {
    //         alunoId: aluno.id,
    //         nome: aluno.nome,
    //         faixa: aluno.faixa,
    //         presencas,
    //         aptoGraduacao: presencas >= 20
    //       };
    //     })
    //   );
    //   const aptos = resultado.filter(
    //     aluno => aluno.aptoGraduacao
    //   );
    //   return res.json(aptos);
    // }
    //evolucao
    evolucao(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { alunoId } = req.params;
            const service = new GetEvolucaoAlunoService_1.GetEvolucaoAlunoService();
            const evolucao = yield service.execute(Number(alunoId));
            return res.json(evolucao);
        });
    }
    //Proximas Graduacoes
    proximas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const alunos = yield prisma_1.prisma.aluno.findMany({
                where: {
                    ativo: true
                }
            });
            const resultado = [];
            for (const aluno of alunos) {
                const totalPresencas = yield prisma_1.prisma.aulaAluno.count({
                    where: {
                        alunoId: aluno.id,
                        presente: true,
                    },
                });
                resultado.push({
                    alunoId: aluno.id,
                    nome: aluno.nome,
                    faixa: aluno.faixa,
                    presencas: totalPresencas,
                    aptoGraduacao: totalPresencas >= 20
                });
            }
            return res.json(resultado.filter(aluno => aluno.aptoGraduacao));
        });
    }
}
exports.GraduacoesController = GraduacoesController;
