import { Request, Response } from "express";

import { LoginFamiliaService } from "./services/LoginFamiliaService";
import { GetResumoFamiliaService } from "./services/GetResumoFamiliaService";
import { GetFrequenciaFamiliaService } from "./services/GetFrequenciaFamiliaService";
import { GetMensalidadesFamiliaService } from "./services/GetMensalidadesFamiliaService";
import { PagarMensalidadeFamiliaService } from "./services/PagarMensalidadeFamiliaService";
import { GetAgendaFamiliaService } from "./services/GetAgendaFamiliaService";
import { ListMensagensFamiliaService } from "./services/ListMensagensFamiliaService";
import { EnviarMensagemFamiliaService } from "./services/EnviarMensagemFamiliaService";
import { GetMensagensNaoLidasFamiliaService } from "./services/GetMensagensNaoLidasFamiliaService";
import { GetLojaFamiliaService } from "./services/GetLojaFamiliaService";
import { CriarPedidoFamiliaService } from "./services/CriarPedidoFamiliaService";
import { ListPedidosFamiliaService } from "./services/ListPedidosFamiliaService";
import { garantirAlunoNoEscopo } from "./utils/garantirAlunoNoEscopo";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";

export class PortalFamiliaController {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    const service = new LoginFamiliaService();

    const sessao = await service.execute({ email, senha });

    return res.json(sessao);
  }

  async listarAlunos(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const alunos = await prisma.aluno.findMany({
      where: { id: { in: req.familia!.alunoIds } },
      select: { id: true, nome: true, apelido: true, fotoUrl: true, faixa: true },
    });

    return res.json(alunos);
  }

  async resumo(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new GetResumoFamiliaService();
    const resumo = await service.execute(alunoId);

    return res.json(resumo);
  }

  async frequencia(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new GetFrequenciaFamiliaService();
    const frequencia = await service.execute(alunoId);

    return res.json(frequencia);
  }

  async mensalidades(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new GetMensalidadesFamiliaService();
    const mensalidades = await service.execute(alunoId);

    return res.json(mensalidades);
  }

  async pagarMensalidade(req: Request, res: Response) {
    const alunoId = Number(req.body.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new PagarMensalidadeFamiliaService();
    const resultado = await service.execute(Number(req.params.id), alunoId);

    return res.json(resultado);
  }

  async agenda(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new GetAgendaFamiliaService();
    const agenda = await service.execute(alunoId);

    return res.json(agenda);
  }

  async listarMensagens(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new ListMensagensFamiliaService();
    const mensagens = await service.execute(alunoId, null, "FAMILIA");

    return res.json(mensagens);
  }

  async mensagensNaoLidas(req: Request, res: Response) {
    const service = new GetMensagensNaoLidasFamiliaService();
    const naoLidas = await service.execute(req.familia!.alunoIds);

    return res.json(naoLidas);
  }

  async enviarMensagem(req: Request, res: Response) {
    const alunoId = Number(req.body.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new EnviarMensagemFamiliaService();

    const mensagem = await service.execute({
      alunoId,
      texto: req.body.texto,
      remetenteTipo: "FAMILIA",
      remetenteNome: req.familia!.nome,
    });

    return res.status(201).json(mensagem);
  }

  async loja(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new GetLojaFamiliaService();
    const produtos = await service.execute();

    return res.json(produtos);
  }

  async criarPedido(req: Request, res: Response) {
    const alunoId = Number(req.body.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new CriarPedidoFamiliaService();
    const pedido = await service.execute(alunoId, req.body.itens);

    return res.status(201).json(pedido);
  }

  async listarPedidos(req: Request, res: Response) {
    const alunoId = Number(req.params.alunoId);
    garantirAlunoNoEscopo(req.familia!.alunoIds, alunoId);

    const service = new ListPedidosFamiliaService();
    const pedidos = await service.execute(alunoId);

    return res.json(pedidos);
  }
}
