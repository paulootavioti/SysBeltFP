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
exports.CreateUsuarioService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const bcryptjs_1 = require("bcryptjs");
const AppError_1 = require("../../../shared/errors/AppError");
class CreateUsuarioService {
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ nome, email, senha, perfil }) {
            const usuarioExistente = yield prisma_1.prisma.usuario.findUnique({
                where: {
                    email
                }
            });
            if (usuarioExistente) {
                throw new AppError_1.AppError("E-mail já cadastrado.");
            }
            const senhaHash = yield (0, bcryptjs_1.hash)(senha, 8);
            return prisma_1.prisma.usuario.create({
                data: {
                    nome,
                    email,
                    senha: senhaHash,
                    perfil
                }
            });
        });
    }
}
exports.CreateUsuarioService = CreateUsuarioService;
