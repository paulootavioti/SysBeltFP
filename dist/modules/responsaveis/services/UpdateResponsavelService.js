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
exports.UpdateResponsavelService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class UpdateResponsavelService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const responsavel = yield prisma_1.prisma.responsavel.findUnique({
                where: { id: data.id },
            });
            if (!responsavel) {
                throw new AppError_1.AppError("Responsável não encontrado.");
            }
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: { id: data.alunoId },
            });
            if (!aluno) {
                throw new AppError_1.AppError("Aluno não encontrado.");
            }
            if (data.cpf) {
                const cpfExistente = yield prisma_1.prisma.responsavel.findFirst({
                    where: {
                        cpf: data.cpf,
                        NOT: {
                            id: data.id,
                        },
                    },
                });
                if (cpfExistente) {
                    throw new AppError_1.AppError("Já existe outro responsável cadastrado com este CPF.");
                }
            }
            return prisma_1.prisma.responsavel.update({
                where: { id: data.id },
                data: {
                    nome: data.nome,
                    cpf: data.cpf,
                    rg: data.rg,
                    dataNascimento: data.dataNascimento
                        ? new Date(data.dataNascimento)
                        : null,
                    sexo: data.sexo,
                    telefone: data.telefone,
                    whatsapp: data.whatsapp,
                    email: data.email,
                    cep: data.cep,
                    logradouro: data.logradouro,
                    numero: data.numero,
                    complemento: data.complemento,
                    bairro: data.bairro,
                    cidade: data.cidade,
                    uf: data.uf,
                    parentesco: data.parentesco,
                    responsavelFinanceiro: (_a = data.responsavelFinanceiro) !== null && _a !== void 0 ? _a : false,
                    podeBuscar: (_b = data.podeBuscar) !== null && _b !== void 0 ? _b : true,
                    contatoEmergencia: (_c = data.contatoEmergencia) !== null && _c !== void 0 ? _c : false,
                    recebeComunicados: (_d = data.recebeComunicados) !== null && _d !== void 0 ? _d : true,
                    observacoes: data.observacoes,
                    fotoUrl: data.fotoUrl,
                    alunoId: data.alunoId,
                },
            });
        });
    }
}
exports.UpdateResponsavelService = UpdateResponsavelService;
