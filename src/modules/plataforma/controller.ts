import { Request, Response } from "express";

import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { AlterarAssinaturaPlataformaService } from "./services/AlterarAssinaturaPlataformaService";
import { CreateContaService } from "./services/CreateContaService";
import { GerarFaturasPlataformaService } from "./services/GerarFaturasPlataformaService";
import { ListContasService } from "./services/ListContasService";
import { MarcarFaturaPagaService } from "./services/MarcarFaturaPagaService";
import { ObterAssinaturaDaContaService } from "./services/ObterAssinaturaDaContaService";
import {
  CreatePlanoPlataformaService,
  ListPlanosPlataformaService,
  UpdatePlanoPlataformaService,
} from "./services/PlanosPlataformaService";

export class PlataformaController {
  // ---- operador do SaaS ----

  async listarPlanos(req: Request, res: Response) {
    const planos = await new ListPlanosPlataformaService().execute(req.query.ativos === "true");

    return res.json(planos);
  }

  async criarPlano(req: Request, res: Response) {
    const plano = await new CreatePlanoPlataformaService().execute(req.body);

    return res.status(201).json(plano);
  }

  async atualizarPlano(req: Request, res: Response) {
    const plano = await new UpdatePlanoPlataformaService().execute(
      Number(req.params.id),
      req.body
    );

    return res.json(plano);
  }

  async listarContas(_req: Request, res: Response) {
    const contas = await new ListContasService().execute();

    return res.json(contas);
  }

  // Detalhe de UM assinante, pro operador acompanhar e dar baixa. É o
  // mesmo serviço que alimenta a tela do dono — a diferença é só de onde
  // vem o contaId: aqui da URL (o operador escolhe), lá da unidade ativa
  // (o dono não escolhe).
  async detalharConta(req: Request, res: Response) {
    const assinatura = await new ObterAssinaturaDaContaService().execute(
      Number(req.params.contaId)
    );

    return res.json(assinatura);
  }

  async criarConta(req: Request, res: Response) {
    const resultado = await new CreateContaService().execute(req.body);

    return res.status(201).json(resultado);
  }

  async alterarAssinatura(req: Request, res: Response) {
    const assinatura = await new AlterarAssinaturaPlataformaService().execute(
      Number(req.params.contaId),
      req.body
    );

    return res.json(assinatura);
  }

  async fechamentoManual(_req: Request, res: Response) {
    const resultado = await new GerarFaturasPlataformaService().execute();

    return res.json(resultado);
  }

  async fechamentoCron(_req: Request, res: Response) {
    const resultado = await new GerarFaturasPlataformaService().execute();

    return res.json(resultado);
  }

  async marcarFaturaPaga(req: Request, res: Response) {
    const fatura = await new MarcarFaturaPagaService().execute(Number(req.params.id));

    return res.json(fatura);
  }

  // ---- dono da academia ----

  async minhaAssinatura(req: Request, res: Response) {
    const contaId = await resolverContaDoUsuario(req);

    const assinatura = await new ObterAssinaturaDaContaService().execute(contaId);

    return res.json(assinatura);
  }
}

// A conta vem da unidade ativa do usuário — nunca do corpo da requisição,
// senão um ADMIN leria a assinatura (e o faturamento) de outro assinante
// mandando outro contaId.
async function resolverContaDoUsuario(req: Request): Promise<number> {
  const prisma = prismaDaRequisicao();
  if (!req.user.unidadeId) {
    throw new AppError("Selecione uma unidade para ver a assinatura da conta.");
  }

  const unidade = await prisma.unidade.findUnique({
    where: { id: req.user.unidadeId },
    select: { contaId: true },
  });

  if (!unidade) {
    throw new AppError("Unidade não encontrada.", 404);
  }

  return unidade.contaId;
}
