import { Request, Response } from "express";

import { ListUsuariosService } from "./services/ListUsuariosService";
import { ListProfessoresService } from "./services/ListProfessoresService";
import { ListMinhasUnidadesService } from "./services/ListMinhasUnidadesService";
import { UpdatePerfilUsuarioService } from "./services/UpdatePerfilUsuarioService";
import { ToggleUsuarioAtivoService } from "./services/ToggleUsuarioAtivoService";
import { UpdateUsuarioService } from "./services/UpdateUsuarioService";
import { AppError } from "../../shared/errors/AppError";
import { PERFIS_MULTI_UNIDADE } from "../../shared/constants/perfis";
import { garantirConcessaoSuperadminPermitida } from "../../shared/security/superadminLegado";
import { normalizarUnidadesDoAssinante } from "./utils/normalizarUnidadesDoAssinante";

export class UsuariosController {

  async list(
    req: Request,
    res: Response
  ) {

    const service =
      new ListUsuariosService();

    const usuarios =
      await service.execute(req.user.unidadeId);

    return res.json(usuarios);

  }

  async listarProfessores(
    req: Request,
    res: Response
  ) {

    const service =
      new ListProfessoresService();

    const professores =
      await service.execute(req.user.unidadeId);

    return res.json(professores);

  }

  async listarMinhasUnidades(
    req: Request,
    res: Response
  ) {

    const service =
      new ListMinhasUnidadesService();

    const unidades =
      await service.execute(req.user.id);

    return res.json(unidades);

  }

  async updatePerfil(
    req: Request,
    res: Response
  ) {

    const { id } =
      req.params;

    const { perfil } =
      req.body;

    garantirConcessaoSuperadminPermitida(perfil, req.user.perfil);

    const service =
      new UpdatePerfilUsuarioService();

    const usuario =
      await service.execute(
        Number(id),
        perfil,
        req.user.unidadeId
      );

    return res.json(usuario);

  }

  async update(
    req: Request,
    res: Response
  ) {

    const { id } =
      req.params;

    garantirConcessaoSuperadminPermitida(req.body.perfil, req.user.perfil);

    const unidadeIds = await normalizarUnidadesDoAssinante(
      req.body.unidadeIds,
      req.user.unidadeId
    );

    if (unidadeIds && unidadeIds.length > 1 && !PERFIS_MULTI_UNIDADE.includes(req.body.perfil)) {
      throw new AppError("Só usuários Admin, Professor ou Recepção podem ser vinculados a mais de uma unidade.");
    }

    const service =
      new UpdateUsuarioService();

    const usuario =
      await service.execute(
        Number(id),
        { ...req.body, unidadeIds },
        req.user.unidadeId
      );

    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      apelido: usuario.apelido,
      email: usuario.email,
      perfil: usuario.perfil,
      nivelGraduacao: usuario.nivelGraduacao,
      outrasGraduacoes: usuario.outrasGraduacoes,
      fotoUrl: usuario.fotoUrl,
      ativo: usuario.ativo
    });

  }

  async toggleAtivo(
    req: Request,
    res: Response
  ) {

    const { id } =
      req.params;

    const service =
      new ToggleUsuarioAtivoService();

    const usuario =
      await service.execute(
        Number(id),
        req.user.unidadeId
      );

    return res.json(usuario);

  }

}
