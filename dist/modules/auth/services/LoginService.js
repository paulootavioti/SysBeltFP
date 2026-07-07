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
exports.LoginService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = require("../../../shared/errors/AppError");
class LoginService {
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ email, senha }) {
            const usuario = yield prisma_1.prisma.usuario.findUnique({
                where: {
                    email
                }
            });
            if (!usuario) {
                throw new AppError_1.AppError("Usuário ou senha inválidos.");
            }
            if (!usuario.ativo) {
                throw new AppError_1.AppError("Usuário inativo.", 403);
            }
            const senhaCorreta = yield (0, bcryptjs_1.compare)(senha, usuario.senha);
            if (!senhaCorreta) {
                throw new AppError_1.AppError("Usuário ou senha inválidos.");
            }
            // Antes de validar a senha
            //if (!usuario.ativo) {
            //   throw new AppError(
            //     "Usuário inativo."
            //   );
            // }
            const jwtSecret = process.env.JWT_SECRET;
            const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "7d");
            const token = (0, jsonwebtoken_1.sign)({
                perfil: usuario.perfil
            }, jwtSecret, {
                subject: String(usuario.id),
                expiresIn: jwtExpiresIn
            });
            return {
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil
                },
                token
            };
        });
    }
}
exports.LoginService = LoginService;
