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
exports.CompeticoesController = void 0;
const prisma_1 = require("../../shared/database/prisma");
class CompeticoesController {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nome, data, local } = req.body;
            const competicao = yield prisma_1.prisma.competicao.create({
                data: {
                    nome,
                    data: new Date(data),
                    local
                }
            });
            return res.status(201).json(competicao);
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const competicoes = yield prisma_1.prisma.competicao.findMany({
                orderBy: {
                    data: "desc"
                }
            });
            return res.json(competicoes);
        });
    }
    // Inscricao em competicoes
    inscrever(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { competicaoId, alunoId } = req.body;
            const inscricao = yield prisma_1.prisma.competicaoAluno.create({
                data: {
                    competicaoId: Number(competicaoId),
                    alunoId: Number(alunoId)
                }
            });
            return res.status(201).json(inscricao);
        });
    }
    // Listar atletas inscritos
    atletas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const atletas = yield prisma_1.prisma.competicaoAluno.findMany({
                where: {
                    competicaoId: Number(id)
                },
                include: {
                    aluno: true,
                    competicao: true
                }
            });
            return res.json(atletas);
        });
    }
    // Registrar resultado
    resultado(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { resultado } = req.body;
            const inscricao = yield prisma_1.prisma.competicaoAluno.update({
                where: {
                    id: Number(id)
                },
                data: {
                    resultado
                }
            });
            return res.json(inscricao);
        });
    }
}
exports.CompeticoesController = CompeticoesController;
