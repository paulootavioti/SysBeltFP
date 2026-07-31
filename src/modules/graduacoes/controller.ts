import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { CreateGraduacaoService } from "./services/CreateGraduacaoService";
import { GetEvolucaoAlunoService } from "./services/GetEvolucaoAlunoService";
import { IncrementarGrauService } from "./services/IncrementarGrauService";
import { ListProximasGraduacoesService } from "./services/ListProximasGraduacoesService";
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

    const graduacoes = await prisma.graduacao.findMany({
      where: escopoUnidade(req.user.unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        aluno: true
      },
      orderBy: {
        data: "desc"
      }
    });

    return res.json(graduacoes);
  }

  // Historico de Graduacoes
  async aluno(req: Request, res: Response) {

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
