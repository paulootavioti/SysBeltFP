import { Request, Response } from "express";

import { CreateUsuarioService } from "./services/CreateUsuarioService";
import { LoginService } from "./services/LoginService";
import { AppError } from "../../shared/errors/AppError";
import { PERFIS_MULTI_UNIDADE } from "../../shared/constants/perfis";
import { normalizarUnidadesDoAssinante } from "../usuarios/utils/normalizarUnidadesDoAssinante";
import { obterContextoRequisicao } from "../../shared/context/contextoRequisicao";
import { SolicitarRedefinicaoSenhaService } from "./services/SolicitarRedefinicaoSenhaService";
import { RedefinirSenhaService } from "./services/RedefinirSenhaService";
import { ConcluirLoginDoisFatoresService } from "./services/ConcluirLoginDoisFatoresService";

export class AuthController {
  async solicitarRedefinicaoSenha(req: Request, res: Response) {
    await new SolicitarRedefinicaoSenhaService().execute(req.body.email, req.body.origem);
    return res.status(202).json({ message: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes." });
  }

  async redefinirSenha(req: Request, res: Response) {
    await new RedefinirSenhaService().execute(req.body.token, req.body.senha);
    return res.json({ message: "Senha redefinida com sucesso." });
  }

  async register(req: Request, res: Response) {
    const alcance = obterContextoRequisicao().unidadesDoUsuario ?? [];

    const unidadeIdsBrutos =
      (await normalizarUnidadesDoAssinante(req.body.unidadeIds, alcance)) ?? [];

    if (unidadeIdsBrutos.length > 1 && !PERFIS_MULTI_UNIDADE.includes(req.body.perfil)) {
      throw new AppError("Só usuários Admin, Professor ou Recepção podem ser vinculados a mais de uma unidade.");
    }

    const service = new CreateUsuarioService();

    // O DONO nasce sem unidade ATIVA (RN-164). É esse o estado "todas as
    // unidades" do seletor (RN-165): o front deixa de mandar o X-Unidade-Id e
    // a requisição volta ao valor gravado. Gravado com uma filial, ele nunca
    // teria para onde voltar.
    //
    // A conta dele sai de qualquer unidade informada; não vindo nenhuma, das
    // do próprio cadastrante — o DONO acaba vinculado à academia inteira de
    // todo jeito, no service.
    const ehDono = req.body.perfil === "DONO";
    const unidadeId = ehDono ? null : (unidadeIdsBrutos[0] ?? req.user.unidadeId);
    const unidadeIds = ehDono && !unidadeIdsBrutos.length ? alcance : unidadeIdsBrutos;

    if (!ehDono && !unidadeId) {
      throw new AppError("Informe a unidade para este usuário.");
    }

    const usuario = await service.execute({ ...req.body, unidadeId, unidadeIds });

    return res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      apelido: usuario.apelido,
      email: usuario.email,
      perfil: usuario.perfil,
      nivelGraduacao: usuario.nivelGraduacao,
      outrasGraduacoes: usuario.outrasGraduacoes,
      fotoUrl: usuario.fotoUrl
    });
  }

  async login(req: Request, res: Response) {
    const service = new LoginService();

    const resultado = await service.execute(req.body);

    return res.json(resultado);
  }

  async concluirLoginDoisFatores(req: Request, res: Response) {
    return res.json(await new ConcluirLoginDoisFatoresService().execute(req.body.desafio, req.body.codigo));
  }
}
