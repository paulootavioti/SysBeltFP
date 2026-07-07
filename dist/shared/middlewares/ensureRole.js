"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRole = ensureRole;
const AppError_1 = require("../errors/AppError");
function ensureRole(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.perfil)) {
            throw new AppError_1.AppError("Acesso negado.", 403);
        }
        next();
    };
}
