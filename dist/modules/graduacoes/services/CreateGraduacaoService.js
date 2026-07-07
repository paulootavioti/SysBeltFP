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
exports.CreateGraduacaoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class CreateGraduacaoService {
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ faixa, data, alunoId }) {
            const graduacao = yield prisma_1.prisma.graduacao.create({
                data: {
                    faixa,
                    data: new Date(data),
                    alunoId
                }
            });
            yield prisma_1.prisma.aluno.update({
                where: {
                    id: alunoId
                },
                data: {
                    faixa
                }
            });
            return graduacao;
        });
    }
}
exports.CreateGraduacaoService = CreateGraduacaoService;
