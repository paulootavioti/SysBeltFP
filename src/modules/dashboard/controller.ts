
import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { AppError } from "../../shared/errors/AppError";
import { GetResumoPeriodoService } from "./services/GetResumoPeriodoService";
import type { Periodo } from "./utils/periodo";

const PERIODOS_VALIDOS: Periodo[] = ["DIARIO", "SEMANAL", "MENSAL", "ANUAL"];

export class DashboardController {

  async resumo(req: Request, res: Response) {

    const alunosAtivos =
      await prisma.aluno.count({
        where: {
          ativo: true
        }
      });

    const responsaveis =
      await prisma.responsavel.count();

    const mensalidadesPendentes =
      await prisma.mensalidade.count({
        where: {
          pago: false
        }
      });

    const mensalidadesVencidas =
      await prisma.mensalidade.count({
        where: {
          pago: false,
          vencimento: {
            lt: new Date()
          }
        }
      });

    const recebido =
      await prisma.mensalidade.aggregate({
        where: {
          pago: true
        },
        _sum: {
          valor: true
        }
      });

    const pendente =
      await prisma.mensalidade.aggregate({
        where: {
          pago: false
        },
        _sum: {
          valor: true
        }
      });

    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);

    amanha.setDate(amanha.getDate() + 1);

    const presencasHoje =
      await prisma.aulaAluno.count({
        where: {
          createdAt: {
            gte: hoje,
            lt: amanha
          }
        }
      });

    const graduacoes =
      await prisma.graduacao.count();

    const competicoes =
      await prisma.competicao.count();

    return res.json({
      alunosAtivos,
      responsaveis,
      mensalidadesPendentes,
      mensalidadesVencidas,
      totalRecebido:
        recebido._sum.valor || 0,
      totalPendente:
        pendente._sum.valor || 0,
      presencasHoje,
      graduacoes,
      competicoes
    });
  }

  async resumoPeriodo(req: Request, res: Response) {

    const periodo = String(req.query.periodo || "MENSAL").toUpperCase();

    if (!PERIODOS_VALIDOS.includes(periodo as Periodo)) {
      throw new AppError(
        `Período inválido. Use um dos seguintes: ${PERIODOS_VALIDOS.join(", ")}.`
      );
    }

    const service = new GetResumoPeriodoService();

    const resumo = await service.execute(periodo as Periodo);

    return res.json(resumo);
  }
}