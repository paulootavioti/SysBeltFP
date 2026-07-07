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
exports.UsuariosController = void 0;
const ListUsuariosService_1 = require("./services/ListUsuariosService");
const UpdatePerfilUsuarioService_1 = require("./services/UpdatePerfilUsuarioService");
const ToggleUsuarioAtivoService_1 = require("./services/ToggleUsuarioAtivoService");
class UsuariosController {
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new ListUsuariosService_1.ListUsuariosService();
            const usuarios = yield service.execute();
            return res.json(usuarios);
        });
    }
    updatePerfil(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { perfil } = req.body;
            const service = new UpdatePerfilUsuarioService_1.UpdatePerfilUsuarioService();
            const usuario = yield service.execute(Number(id), perfil);
            return res.json(usuario);
        });
    }
    toggleAtivo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const service = new ToggleUsuarioAtivoService_1.ToggleUsuarioAtivoService();
            const usuario = yield service.execute(Number(id));
            return res.json(usuario);
        });
    }
}
exports.UsuariosController = UsuariosController;
