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
exports.ensureAuthenticated = ensureAuthenticated;
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = require("../errors/AppError");
const prisma_1 = require("../database/prisma");
function ensureAuthenticated(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError_1.AppError("Token não informado.", 401);
        }
        const [, token] = authHeader.split(" ");
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            const usuario = yield prisma_1.prisma.usuario.findUnique({
                where: {
                    id: Number(decoded.sub)
                }
            });
            if (!usuario) {
                throw new AppError_1.AppError("Usuário não encontrado.", 401);
            }
            if (!usuario.ativo) {
                throw new AppError_1.AppError("Usuário inativo.", 403);
            }
            req.user = {
                id: usuario.id,
                perfil: usuario.perfil
            };
            return next();
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError("Token inválido.", 401);
        }
    });
}
