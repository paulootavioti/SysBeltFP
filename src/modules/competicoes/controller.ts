import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { DeleteCompeticaoService } from "./services/DeleteCompeticaoService";
import { LIMITE_PADRAO_LISTAGEM } from "../../shared/constants/pagination";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { escopoUnidade, garantirAcessoUnidade } from "../../shared/utils/escopoUnidade";
import { AppError } from "../../shared/errors/AppError";

export class CompeticoesController {

  async create(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const {
      nome,
      data,
      local
    } = req.body;

    const competicao = await prisma.competicao.create({
      data: {
        unidadeId: requireUnidadeId(req),
        nome,
        data: new Date(data),
        local
      }
    });

    return res.status(201).json(competicao);
  }

  async list(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const competicoes = await prisma.competicao.findMany({
      where: escopoUnidade(req.user.unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: {
        data: "desc"
      }
    });

    return res.json(competicoes);
  }

  // Inscricao em competicoes
  async inscrever(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const {
      competicaoId,
      alunoId
    } = req.body;

    const competicao = await prisma.competicao.findUnique({ where: { id: Number(competicaoId) } });

    if (!competicao) {
      throw new AppError("Competição não encontrada.");
    }

    garantirAcessoUnidade(req.user.unidadeId, competicao.unidadeId, "Competição não encontrada.");

    const aluno = await prisma.aluno.findUnique({ where: { id: Number(alunoId) } });

    if (!aluno || aluno.unidadeId !== competicao.unidadeId) {
      throw new AppError("Aluno não encontrado.");
    }

    const inscricao = await prisma.competicaoAluno.create({
      data: {
        competicaoId: Number(competicaoId),
        alunoId: Number(alunoId)
      }
    });

    return res.status(201).json(inscricao);
  }


  // Listar atletas inscritos
  async atletas(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const { id } = req.params;

    const competicao = await prisma.competicao.findUnique({ where: { id: Number(id) } });

    if (!competicao) {
      throw new AppError("Competição não encontrada.");
    }

    garantirAcessoUnidade(req.user.unidadeId, competicao.unidadeId, "Competição não encontrada.");

    const atletas = await prisma.competicaoAluno.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        competicaoId: Number(id)
      },
      include: {
        aluno: true,
        competicao: true
      }
    });

    return res.json(atletas);
  }


  // Registrar resultado
  async resultado(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const { id } = req.params;

    const { resultado } = req.body;

    const inscricaoExistente = await prisma.competicaoAluno.findUnique({
      where: { id: Number(id) },
      include: { competicao: true },
    });

    if (!inscricaoExistente) {
      throw new AppError("Inscrição não encontrada.");
    }

    garantirAcessoUnidade(
      req.user.unidadeId,
      inscricaoExistente.competicao.unidadeId,
      "Inscrição não encontrada."
    );

    const inscricao =
      await prisma.competicaoAluno.update({
        where: {
          id: Number(id)
        },
        data: {
          resultado
        }
      });

    return res.json(inscricao);
  }

  async delete(req: Request, res: Response) {
    const service = new DeleteCompeticaoService();

    await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.status(204).send();
  }
}
