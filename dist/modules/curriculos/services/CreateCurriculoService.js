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
exports.CreateCurriculoService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class CreateCurriculoService {
    execute(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            return prisma_1.prisma.curriculo.create({
                data: {
                    nome: data.nome,
                    descricao: data.descricao,
                    modalidade: (_a = data.modalidade) !== null && _a !== void 0 ? _a : "Jiu-Jitsu",
                    publico: (_b = data.publico) !== null && _b !== void 0 ? _b : "Kids",
                },
            });
        });
    }
}
exports.CreateCurriculoService = CreateCurriculoService;
