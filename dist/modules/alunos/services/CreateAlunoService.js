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
exports.CreateAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }
    return Number(value);
}
class CreateAlunoService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const dataNascimentoFormatada = new Date(data.dataNascimento);
            const inicioDia = new Date(Date.UTC(dataNascimentoFormatada.getUTCFullYear(), dataNascimentoFormatada.getUTCMonth(), dataNascimentoFormatada.getUTCDate()));
            const fimDia = new Date(Date.UTC(dataNascimentoFormatada.getUTCFullYear(), dataNascimentoFormatada.getUTCMonth(), dataNascimentoFormatada.getUTCDate() + 1));
            const alunoExistente = yield prisma_1.prisma.aluno.findFirst({
                where: {
                    nome: data.nome,
                    dataNascimento: {
                        gte: inicioDia,
                        lt: fimDia,
                    },
                },
            });
            if (alunoExistente) {
                throw new AppError_1.AppError("Já existe um aluno cadastrado com este nome e data de nascimento.");
            }
            const aluno = yield prisma_1.prisma.aluno.create({
                data: {
                    nome: data.nome,
                    dataNascimento: dataNascimentoFormatada,
                    sexo: data.sexo,
                    cpf: data.cpf,
                    rg: data.rg,
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
                    escola: data.escola,
                    serieEscolar: data.serieEscolar,
                    turnoEscolar: data.turnoEscolar,
                    peso: toNumberOrNull(data.peso),
                    altura: toNumberOrNull(data.altura),
                    tamanhoKimono: data.tamanhoKimono,
                    marcaKimono: data.marcaKimono,
                    restricoesMedicas: data.restricoesMedicas,
                    alergias: data.alergias,
                    medicamentos: data.medicamentos,
                    observacoes: data.observacoes,
                    fotoUrl: data.fotoUrl,
                    faixa: (_a = data.faixa) !== null && _a !== void 0 ? _a : "Branca",
                    turmaId: toNumberOrNull(data.turmaId),
                    ativo: true,
                },
            });
            return aluno;
        });
    }
}
exports.CreateAlunoService = CreateAlunoService;
