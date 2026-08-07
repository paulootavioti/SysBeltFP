import { Request, Response } from "express";
import { timingSafeEqual } from "crypto";

import { prisma } from "../../shared/database/prisma";
import { AppError } from "../../shared/errors/AppError";
import { escopoUnidade, garantirAcessoUnidade } from "../../shared/utils/escopoUnidade";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { RegistrarEventoAcessoService } from "./services/RegistrarEventoAcessoService";
import { ListEventosAcessoService } from "./services/ListEventosAcessoService";
import { AutorizarAcessoService } from "./services/AutorizarAcessoService";
import { CriarCredencialService } from "./services/CriarCredencialService";
import { obterProvedorAcesso } from "./providers";

export class ControleAcessoController {
  async listarDispositivos(req: Request, res: Response) {
    const dispositivos = await prisma.dispositivoAcesso.findMany({
      where: escopoUnidade(req.user.unidadeId),
      orderBy: { nome: "asc" },
    });

    // configuracao guarda credenciais do equipamento — não sai na listagem.
    return res.json(
      dispositivos.map(({ configuracao: _c, segredoWebhook: _s, ...resto }) => resto)
    );
  }

  async criarDispositivo(req: Request, res: Response) {
    const dispositivo = await prisma.dispositivoAcesso.create({
      data: {
        unidadeId: requireUnidadeId(req),
        nome: req.body.nome,
        localizacao: req.body.localizacao ?? null,
        provedor: req.body.provedor ?? null,
        configuracao: req.body.configuracao ?? undefined,
        segredoWebhook: req.body.segredoWebhook ?? null,
        ativo: req.body.ativo ?? true,
      },
    });

    const { configuracao: _c, segredoWebhook: _s, ...resto } = dispositivo;

    return res.status(201).json(resto);
  }

  async criarCredencial(req: Request, res: Response) {
    const service = new CriarCredencialService();

    const credencial = await service.execute(req.body);

    return res.status(201).json(credencial);
  }

  async revogarCredencial(req: Request, res: Response) {
    const id = Number(req.params.id);

    const credencial = await prisma.credencialAcesso.findUnique({
      where: { id },
      include: { dispositivo: true },
    });

    if (!credencial) {
      throw new AppError("Credencial não encontrada.", 404);
    }

    if (credencial.dispositivo) {
      garantirAcessoUnidade(
        req.user.unidadeId,
        credencial.dispositivo.unidadeId,
        "Credencial não encontrada."
      );

      // tira a pessoa do equipamento também — se ficar só no banco, o rosto
      // continua abrindo a catraca.
      if (credencial.provedorPessoaId) {
        const provedor = obterProvedorAcesso(credencial.dispositivo.provedor);
        await provedor.removerPessoa(
          credencial.provedorPessoaId,
          (credencial.dispositivo.configuracao ?? {}) as Record<string, unknown>
        );
      }
    }

    const atualizada = await prisma.credencialAcesso.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json(atualizada);
  }

  async listarEventos(req: Request, res: Response) {
    const service = new ListEventosAcessoService();

    const eventos = await service.execute(req.user, {
      alunoId: req.query.alunoId ? Number(req.query.alunoId) : undefined,
      dispositivoId: req.query.dispositivoId ? Number(req.query.dispositivoId) : undefined,
      autorizado:
        req.query.autorizado === undefined ? undefined : req.query.autorizado === "true",
      limite: req.query.limite ? Number(req.query.limite) : undefined,
    });

    return res.json(eventos);
  }

  // Consulta on-line: equipamento "burro" pergunta ao servidor a cada
  // passagem se libera ou não. Autenticado pelo segredo do dispositivo.
  async autorizar(req: Request, res: Response) {
    const dispositivo = await autenticarDispositivo(req);

    const service = new AutorizarAcessoService();

    const decisao = await service.execute({
      credencialId: req.body.credencialId ?? null,
      alunoId: req.body.alunoId ?? null,
      usuarioId: req.body.usuarioId ?? null,
      sentido: req.body.sentido ?? "ENTRADA",
    });

    await prisma.dispositivoAcesso.update({
      where: { id: dispositivo.id },
      data: { ultimoContatoEm: new Date() },
    });

    return res.json(decisao);
  }

  // Webhook de evento — o equipamento avisa o que aconteceu.
  async receberEvento(req: Request, res: Response) {
    const dispositivo = await autenticarDispositivo(req);

    const service = new RegistrarEventoAcessoService();

    const evento = await service.execute({
      dispositivoId: dispositivo.id,
      payload: req.body,
    });

    return res.status(201).json({ id: evento.id, autorizado: evento.autorizado, motivo: evento.motivo });
  }
}

// Catraca não faz login: identifica-se pelo id + segredo combinado no
// cadastro do dispositivo. Comparação em tempo constante pra não vazar o
// segredo por diferença de tempo de resposta.
async function autenticarDispositivo(req: Request) {
  const id = Number(req.params.id);
  const segredo = req.headers["x-dispositivo-segredo"];

  const dispositivo = await prisma.dispositivoAcesso.findUnique({ where: { id } });

  if (!dispositivo || !dispositivo.ativo) {
    throw new AppError("Dispositivo não encontrado.", 404);
  }

  if (!dispositivo.segredoWebhook) {
    throw new AppError("Dispositivo sem segredo configurado.", 403);
  }

  const esperado = Buffer.from(dispositivo.segredoWebhook);
  const recebido = Buffer.from(typeof segredo === "string" ? segredo : "");

  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) {
    throw new AppError("Segredo do dispositivo inválido.", 401);
  }

  return dispositivo;
}
