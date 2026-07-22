import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { CreateGraduacaoService } from "./services/CreateGraduacaoService";
import { GetEvolucaoAlunoService } from "./services/GetEvolucaoAlunoService";
import { IncrementarGrauService } from "./services/IncrementarGrauService";
import { LIMITE_PADRAO_LISTAGEM } from "../../shared/constants/pagination";

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
        alunoId: Number(id)
      },
      orderBy: {
        data: "desc"
      }
    });
  
    return res.json(graduacoes);
  }

  // Proximas Graduacoes
  // async proximas(req: Request, res: Response) {

  //   const alunos = await prisma.aluno.findMany({
  //     where: {
  //       ativo: true
  //     }
  //   });
  
  //   const resultado = await Promise.all(
  //     alunos.map(async (aluno) => {
  
  //       const presencas =
  //         await prisma.presenca.count({
  //           where: {
  //             alunoId: aluno.id
  //           }
  //         });
  
  //       return {
  //         alunoId: aluno.id,
  //         nome: aluno.nome,
  //         faixa: aluno.faixa,
  //         presencas,
  //         aptoGraduacao: presencas >= 20
  //       };
  //     })
  //   );
  
  //   const aptos = resultado.filter(
  //     aluno => aluno.aptoGraduacao
  //   );
  
  //   return res.json(aptos);
  // }

  //evolucao
  async evolucao(req: Request, res: Response) {
    const { alunoId } = req.params;
  
    const service = new GetEvolucaoAlunoService();
  
    const evolucao = await service.execute(
      Number(alunoId)
    );
  
    return res.json(evolucao);
  }

  //Proximas Graduacoes
  async proximas(req: Request, res: Response) {

    const alunos = await prisma.aluno.findMany({
      where: {
        ativo: true
      }
    });

    const presencasPorAluno = await prisma.aulaAluno.groupBy({
      by: ["alunoId"],
      where: {
        presente: true,
        alunoId: { in: alunos.map((aluno) => aluno.id) },
      },
      _count: { _all: true },
    });

    const totalPorAluno = new Map(
      presencasPorAluno.map((item) => [item.alunoId, item._count._all])
    );

    const resultado = alunos
      .map((aluno) => {
        const totalPresencas = totalPorAluno.get(aluno.id) ?? 0;

        return {
          alunoId: aluno.id,
          nome: aluno.nome,
          faixa: aluno.faixa,
          presencas: totalPresencas,
          aptoGraduacao: totalPresencas >= 20,
        };
      })
      .filter((aluno) => aluno.aptoGraduacao);

    return res.json(resultado);
  }
}