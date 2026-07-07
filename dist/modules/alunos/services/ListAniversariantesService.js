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
exports.ListAniversariantesService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class ListAniversariantesService {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const mesAtual = new Date().getMonth() + 1;
            const alunos = yield prisma_1.prisma.aluno.findMany({
                where: {
                    ativo: true
                },
                orderBy: {
                    nome: "asc"
                }
            });
            const aniversariantes = alunos.filter(aluno => {
                const mesNascimento = new Date(aluno.dataNascimento)
                    .getMonth() + 1;
                return mesNascimento === mesAtual;
            });
            return aniversariantes.map(aluno => ({
                id: aluno.id,
                nome: aluno.nome,
                dataNascimento: aluno.dataNascimento,
                faixa: aluno.faixa
            }));
        });
    }
}
exports.ListAniversariantesService = ListAniversariantesService;
