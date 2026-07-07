"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../errors/AppError");
function errorHandler(error, req, res, next) {
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message
        });
    }
    console.error(error);
    return res.status(500).json({
        message: "Erro interno do servidor."
    });
}
