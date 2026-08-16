
import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { GetResumoPeriodoService } from "./services/GetResumoPeriodoService";
import { GetAlertasDashboardService } from "./services/GetAlertasDashboardService";
import { GetResumoUnidadesService } from "./services/GetResumoUnidadesService";
import { escopoUnidade } from "../../shared/utils/escopoUnidade";
import type { Periodo } from "./utils/periodo";

const PERIODOS_VALIDOS: Periodo[] = ["DIARIO", "SEMANAL", "MENSAL", "ANUAL"];

function periodoDaQuery(req: Request): Periodo {
  const periodo = String(req.query.periodo || "MENSAL").toUpperCase();

  if (!PERIODOS_VALIDOS.includes(periodo as Periodo)) {
    throw new AppError(`Período inválido. Use um dos seguintes: ${PERIODOS_VALIDOS.join(", ")}.`);
  }

  return periodo as Periodo;
}

export class DashboardController {

  async resumo(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();

    const unidade = escopoUnidade(req.user.unidadeId);

    const alunosAtivos =
      await prisma.aluno.count({
        where: {
          ativo: true,
          ...unidade
        }
      });

    const responsaveis =
      await prisma.responsavel.count({
        where: unidade
      });

    const mensalidadesPendentes =
      await prisma.mensalidade.count({
        where: {
          pago: false,
          ...unidade
        }
      });

    const mensalidadesVencidas =
      await prisma.mensalidade.count({
        where: {
          pago: false,
          vencimento: {
            lt: new Date()
          },
          ...unidade
        }
      });

    const recebido =
      await prisma.mensalidade.aggregate({
        where: {
          pago: true,
          ...unidade
        },
        _sum: {
          valor: true
        }
      });

    const pendente =
      await prisma.mensalidade.aggregate({
        where: {
          pago: false,
          ...unidade
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
          },
          aula: unidade
        }
      });

    const graduacoes =
      await prisma.graduacao.count({
        where: unidade
      });

    const competicoes =
      await prisma.competicao.count({
        where: unidade
      });

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

    const periodo = periodoDaQuery(req);

    const service = new GetResumoPeriodoService();

    const resumo = await service.execute(periodo, req.user.unidadeId);

    return res.json(resumo);
  }

  async alertas(req: Request, res: Response) {

    const service = new GetAlertasDashboardService();

    const alertas = await service.execute(req.user.unidadeId);

    return res.json(alertas);
  }

  async unidades(req: Request, res: Response) {

    const periodo = periodoDaQuery(req);

    const service = new GetResumoUnidadesService();

    const unidades = await service.execute(req.user.unidadeId, periodo);

    return res.json(unidades);
  }
}
