import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { CreateGraduacaoService } from "./services/CreateGraduacaoService";
import { GetEvolucaoAlunoService } from "./services/GetEvolucaoAlunoService";
import { IncrementarGrauService } from "./services/IncrementarGrauService";
import { ListProximasGraduacoesService } from "./services/ListProximasGraduacoesService";
import { SolicitarGraduacaoService } from "./services/SolicitarGraduacaoService";
import { AprovarGraduacaoService } from "./services/AprovarGraduacaoService";
import { RejeitarGraduacaoService } from "./services/RejeitarGraduacaoService";
import { LIMITE_PADRAO_LISTAGEM } from "../../shared/constants/pagination";
import { escopoUnidade } from "../../shared/utils/escopoUnidade";

export class GraduacoesController {

  async create(req: Request, res: Response) {
    const {
      faixa,
      data,
      alunoId,
      cobranca
    } = req.body;

    const service = new CreateGraduacaoService();

    const graduacao = await service.execute({
      faixa,
      data,
      alunoId: Number(alunoId),
      cobranca
    });

    return res.status(201).json(graduacao);
  }

  async incrementarGrau(req: Request, res: Response) {
    const { alunoId, cobranca } = req.body;

    const service = new IncrementarGrauService();

    const aluno = await service.execute({
      alunoId: Number(alunoId),
      cobranca
    });

    return res.status(201).json(aluno);
  }

  async list(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const graduacoes = await prisma.graduacao.findMany({
      where: escopoUnidade(req.user.unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        aluno: true,
        solicitadoPor: { select: { id: true, nome: true, apelido: true } },
        revisadoPor: { select: { id: true, nome: true, apelido: true } },
      },
      orderBy: {
        data: "desc"
      }
    });

    return res.json(graduacoes);
  }

  async solicitar(req: Request, res: Response) {
    const { alunoId, faixa, comentario } = req.body;

    const service = new SolicitarGraduacaoService();

    const graduacao = await service.execute({
      alunoId: Number(alunoId),
      faixa,
      comentario,
      solicitanteId: req.user.id,
      unidadeIdSolicitante: req.user.unidadeId,
    });

    return res.status(201).json(graduacao);
  }

  async aprovar(req: Request, res: Response) {
    const { cobranca } = req.body ?? {};

    const service = new AprovarGraduacaoService();

    const graduacao = await service.execute({
      id: Number(req.params.id),
      revisorId: req.user.id,
      unidadeIdRevisor: req.user.unidadeId,
      cobranca,
    });

    return res.json(graduacao);
  }

  async rejeitar(req: Request, res: Response) {
    const { motivoRejeicao } = req.body;

    const service = new RejeitarGraduacaoService();

    const graduacao = await service.execute({
      id: Number(req.params.id),
      revisorId: req.user.id,
      unidadeIdRevisor: req.user.unidadeId,
      motivoRejeicao,
    });

    return res.json(graduacao);
  }

  // Historico de Graduacoes
  async aluno(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const { id } = req.params;

    const graduacoes = await prisma.graduacao.findMany({
      where: {
        alunoId: Number(id),
        ...escopoUnidade(req.user.unidadeId)
      },
      orderBy: {
        data: "desc"
      }
    });

    return res.json(graduacoes);
  }

  //evolucao
  async evolucao(req: Request, res: Response) {
    const { alunoId } = req.params;

    const service = new GetEvolucaoAlunoService();

    const evolucao = await service.execute(
      Number(alunoId),
      req.user.unidadeId
    );

    return res.json(evolucao);
  }

  //Proximas Graduacoes
  async proximas(req: Request, res: Response) {

    const service = new ListProximasGraduacoesService();

    // por padrão só retorna quem já está apto (usado pelo card do
    // dashboard); ?todos=true traz todo mundo com o progresso calculado,
    // usado pela tela "Próximas Graduações".
    const apenasElegiveis = req.query.todos !== "true";

    const resultado = await service.execute(req.user.unidadeId, apenasElegiveis);

    return res.json(resultado);
  }
}
