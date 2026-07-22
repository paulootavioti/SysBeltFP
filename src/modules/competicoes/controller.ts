import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { DeleteCompeticaoService } from "./services/DeleteCompeticaoService";
import { LIMITE_PADRAO_LISTAGEM } from "../../shared/constants/pagination";

export class CompeticoesController {

  async create(req: Request, res: Response) {

    const {
      nome,
      data,
      local
    } = req.body;

    const competicao = await prisma.competicao.create({
      data: {
        nome,
        data: new Date(data),
        local
      }
    });

    return res.status(201).json(competicao);
  }

  async list(req: Request, res: Response) {

    const competicoes = await prisma.competicao.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: {
        data: "desc"
      }
    });

    return res.json(competicoes);
  }

  // Inscricao em competicoes
  async inscrever(req: Request, res: Response) {

    const {
      competicaoId,
      alunoId
    } = req.body;
  
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

    const { id } = req.params;
  
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

    const { id } = req.params;
  
    const { resultado } = req.body;
  
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

    await service.execute(Number(req.params.id));

    return res.status(204).send();
  }
}