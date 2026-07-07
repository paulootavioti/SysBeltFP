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
exports.UpdateAlunoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }
    return Number(value);
}
class UpdateAlunoService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const aluno = yield prisma_1.prisma.aluno.findUnique({
                where: { id: data.id },
            });
            if (!aluno) {
                throw new AppError_1.AppError("Aluno não encontrado.");
            }
            return prisma_1.prisma.aluno.update({
                where: { id: data.id },
                data: {
                    nome: data.nome,
                    dataNascimento: new Date(data.dataNascimento),
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
                    turmaId: toNumberOrNull(data.turmaId),
                },
            });
        });
    }
}
exports.UpdateAlunoService = UpdateAlunoService;
