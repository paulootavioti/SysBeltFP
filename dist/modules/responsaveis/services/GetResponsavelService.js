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
exports.GetResponsavelService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const AppError_1 = require("../../../shared/errors/AppError");
class GetResponsavelService {
    execute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const responsavel = yield prisma_1.prisma.responsavel.findUnique({
                where: { id },
                include: {
                    aluno: {
                        select: {
                            id: true,
                            nome: true,
                            faixa: true,
                        },
                    },
                },
            });
            if (!responsavel) {
                throw new AppError_1.AppError("Responsável não encontrado.");
            }
            return responsavel;
        });
    }
}
exports.GetResponsavelService = GetResponsavelService;
