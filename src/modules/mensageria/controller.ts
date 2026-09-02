import type { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { escopoUnidade, garantirAcessoUnidade } from "../../shared/utils/escopoUnidade";
import { ProcessarEntradaService } from "./services/ProcessarEntradaService";
import { LembretesBotService } from "./bot/LembretesBotService";
import { DespacharMensagensService } from "./services/DespacharMensagensService";
import { randomUUID } from "node:crypto";
import { AppError } from "../../shared/errors/AppError";
import { Prisma, EstadoConversaMensageria } from "@prisma/client";
import { FluxosBotService } from "./services/FluxosBotService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { infraestruturaMensageria } from "./infra";
import { ConectarCanalMetaService } from "./services/ConectarCanalMetaService";
import { DiagnosticarCanalMetaService } from "./services/DiagnosticarCanalMetaService";
import { ManterCanaisMetaService } from "./services/ManterCanaisMetaService";
import { SincronizarTemplatesMetaService } from "./services/SincronizarTemplatesMetaService";
import { ProcessarMidiasMensageriaService } from "./services/ProcessarMidiasMensageriaService";
import { assinarUrlFoto } from "../uploads/services/assinarUrlFoto";
import { ArmazenarAnexoMensageriaService } from "./services/ArmazenarAnexoMensageriaService";

export class MensageriaController {
  private async tenantKeyDaUnidade(unidadeId: number) {
    const unidade = await prismaDaRequisicao().unidade.findUnique({
      where: { id: unidadeId }, select: { conta: { select: { tenantKey: true } } },
    });
    if (!unidade) throw new AppError("Unidade não encontrada.", 404);
    return unidade.conta.tenantKey;
  }

  private async onboarding(unidadeId: number) {
    const infra = infraestruturaMensageria();
    const tenantKey = await this.tenantKeyDaUnidade(unidadeId);
    return new ConectarCanalMetaService(prismaDaRequisicao(), infra.oauthMeta, infra.escritaSegredos, infra.diretorioMensageria, tenantKey);
  }

  async conectarCanal(request: Request, response: Response) {
    const tipo = request.body?.tipo;
    if (tipo !== "WHATSAPP" && tipo !== "INSTAGRAM") throw new AppError("Canal Meta inválido.");
    const unidadeId = requireUnidadeId(request);
    const resultado = await (await this.onboarding(unidadeId)).executar({
      unidadeId, tipo,
      identificadorExterno: typeof request.body?.identificadorExterno === "string" ? request.body.identificadorExterno : "",
      codigo: typeof request.body?.codigo === "string" ? request.body.codigo : "",
      businessAccountId: typeof request.body?.businessAccountId === "string" ? request.body.businessAccountId : undefined,
    });
    return response.status(201).json(resultado);
  }

  async desativarCanal(request: Request, response: Response) {
    const appSecretRef = process.env.META_APP_SECRET_REF?.trim();
    if (!appSecretRef) throw new AppError("Onboarding Meta não configurado neste ambiente.", 503);
    const unidadeId = requireUnidadeId(request);
    return response.json(await (await this.onboarding(unidadeId)).desativar(unidadeId, Number(request.params.id), appSecretRef));
  }

  async diagnosticarCanal(request: Request, response: Response) {
    const infra = infraestruturaMensageria();
    const unidadeId = requireUnidadeId(request);
    const service = new DiagnosticarCanalMetaService(prismaDaRequisicao(), infra.segredos, infra.oauthMeta, infra.diretorioMensageria, await this.tenantKeyDaUnidade(unidadeId));
    return response.json(await service.executar(unidadeId, Number(request.params.id)));
  }

  async manterCanais(_request: Request, response: Response) {
    const infra = infraestruturaMensageria();
    const service = new ManterCanaisMetaService(prismaDaRequisicao(), infra.segredos, infra.escritaSegredos, infra.oauthMeta, infra.diretorioMensageria);
    return response.json(await service.executar());
  }

  async obterFluxo(request: Request, response: Response) {
    return response.json(await new FluxosBotService(prismaDaRequisicao()).obter(requireUnidadeId(request)));
  }

  async publicarFluxo(request: Request, response: Response) {
    return response.json(await new FluxosBotService(prismaDaRequisicao()).publicar(requireUnidadeId(request), request.body ?? {}));
  }

  async listarCanais(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    const canais = await db.canalMensageria.findMany({
      where: { ...escopoUnidade(request.user.unidadeId) },
      orderBy: [{ tipo: "asc" }, { nomeExibicao: "asc" }],
      select: {
        id: true, tipo: true, nomeExibicao: true, identificadorExterno: true, ativo: true, statusConexao: true, codigoErroConexao: true, validadoEm: true, sincronizadoEm: true, tokenExpiraEm: true, proximaRenovacaoEm: true, ultimoDiagnosticoEm: true, tokenVersao: true, atualizadoEm: true,
        canalCaptacao: { select: { _count: { select: { leads: { where: { criadoEm: { gte: desde } } } } } } },
      },
    });
    return response.json(canais.map((canal) => ({
      id: canal.id, tipo: canal.tipo, nomeExibicao: canal.nomeExibicao,
      conta: `•••• ${canal.identificadorExterno.slice(-4)}`, status: canal.statusConexao, codigoErro: canal.codigoErroConexao,
      leadsUltimos30Dias: canal.canalCaptacao?._count.leads ?? 0, atualizadoEm: canal.atualizadoEm, validadoEm: canal.validadoEm, sincronizadoEm: canal.sincronizadoEm,
      tokenExpiraEm: canal.tokenExpiraEm, proximaRenovacaoEm: canal.proximaRenovacaoEm, ultimoDiagnosticoEm: canal.ultimoDiagnosticoEm, tokenVersao: canal.tokenVersao,
    })));
  }

  async listarConversas(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const pagina = Math.max(Number(request.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(request.query.limite) || 50, 1), 100);
    const where: Prisma.ConversaMensageriaWhereInput = { ...escopoUnidade(request.user.unidadeId) };
    if (request.query.canal === "WHATSAPP" || request.query.canal === "INSTAGRAM") where.canalMensageria = { tipo: request.query.canal };
    if (typeof request.query.estado === "string" && Object.values(EstadoConversaMensageria).includes(request.query.estado as EstadoConversaMensageria)) {
      where.estado = request.query.estado as EstadoConversaMensageria;
    }
    if (request.query.naoLidas === "true") where.naoLidas = { gt: 0 };
    if (typeof request.query.busca === "string" && request.query.busca.trim()) where.contatoNome = { contains: request.query.busca.trim(), mode: "insensitive" };
    const [conversas, total] = await db.$transaction([db.conversaMensageria.findMany({
      where, orderBy: [{ ultimaMensagemEm: "desc" }, { criadoEm: "desc" }], skip: (pagina - 1) * limite, take: limite,
      select: { id: true, unidadeId: true, contatoNome: true, contatoExternoId: true, estado: true, naoLidas: true,
        ultimaMensagemEm: true, canalMensageria: { select: { tipo: true, nomeExibicao: true } },
        lead: { select: { id: true, estagio: true } }, atendente: { select: { id: true, nome: true } },
        mensagens: { orderBy: { enviadaEm: "desc" }, take: 1, select: { conteudo: true, tipoConteudo: true } } },
    }), db.conversaMensageria.count({ where })]);
    return response.json({ itens: conversas, pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) });
  }

  async obterConversa(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const conversa = await db.conversaMensageria.findUnique({
      where: { id: Number(request.params.id) },
      select: { id: true, unidadeId: true, contatoNome: true, contatoExternoId: true, estado: true, naoLidas: true, ultimaMensagemEm: true,
        atendente: { select: { id: true, nome: true } }, canalMensageria: { select: { id: true, tipo: true, nomeExibicao: true } },
        lead: { include: { canal: { select: { nome: true } }, consentimentos: { orderBy: { aceitoEm: "desc" }, take: 5 },
          eventos: { orderBy: { criadoEm: "desc" }, take: 20, include: { usuario: { select: { nome: true } } } } } },
        mensagens: { orderBy: { enviadaEm: "asc" }, select: { id: true, direcao: true, autor: true, usuario: { select: { id: true, nome: true } }, conteudo: true, tipoConteudo: true, statusEntrega: true, erroEnvio: true, tentativasEnvio: true, proximaTentativaEm: true, mediaStatus: true, arquivoUrl: true, arquivoMime: true, arquivoNome: true, arquivoTamanho: true, erroMedia: true, enviadaEm: true } } },
    });
    if (!conversa) return response.status(404).json({ mensagem: "Conversa não encontrada." });
    garantirAcessoUnidade(request.user.unidadeId, conversa.unidadeId, "Conversa não encontrada.");
    if (conversa.naoLidas > 0) await db.conversaMensageria.update({ where: { id: conversa.id }, data: { naoLidas: 0 } });
    const ultimaEntrada = [...conversa.mensagens].reverse().find((mensagem) => mensagem.direcao === "ENTRADA")?.enviadaEm;
    const janelaAtendimentoAte = conversa.canalMensageria.tipo === "WHATSAPP" && ultimaEntrada ? new Date(ultimaEntrada.getTime() + 24 * 60 * 60_000) : null;
    return response.json({ ...conversa, mensagens: conversa.mensagens.map((mensagem) => ({ ...mensagem, arquivoUrl: mensagem.arquivoUrl ? assinarUrlFoto(mensagem.arquivoUrl) : null })), janelaAtendimentoAte, janelaAtendimentoAberta: !janelaAtendimentoAte || janelaAtendimentoAte > new Date(), lead: conversa.lead ? {
      ...conversa.lead,
      slaEstourado: conversa.lead.estagio === "NOVO" && !!conversa.lead.proximaAcaoEm && conversa.lead.proximaAcaoEm < new Date(),
    } : null });
  }

  async responder(request: Request, response: Response) {
    const conteudo = typeof request.body?.conteudo === "string" ? request.body.conteudo.trim() : "";
    const templateId = Number(request.body?.templateId) || undefined;
    const parametros = Array.isArray(request.body?.parametros) ? request.body.parametros.map((item: unknown) => typeof item === "string" ? item.trim() : "") : [];
    if ((!conteudo && !templateId) || conteudo.length > 4_000) throw new AppError("Informe uma mensagem com até 4.000 caracteres ou selecione um template.");
    const db = prismaDaRequisicao();
    const conversa = await db.conversaMensageria.findUnique({ where: { id: Number(request.params.id) } });
    if (!conversa) throw new AppError("Conversa não encontrada.", 404);
    garantirAcessoUnidade(request.user.unidadeId, conversa.unidadeId, "Conversa não encontrada.");
    if (conversa.estado === "ENCERRADA") throw new AppError("Reabra a conversa antes de responder.");
    const template = templateId ? await db.templateMensageria.findFirst({ where: { id: templateId, unidadeId: conversa.unidadeId, canalMensageriaId: conversa.canalMensageriaId, ativo: true, status: "APPROVED", suportado: true } }) : null;
    if (templateId && !template) throw new AppError("Template não encontrado.", 404);
    if (template && (parametros.length !== template.quantidadeParametros || parametros.some((item: string) => !item || item.length > 1_000))) throw new AppError(`Informe os ${template.quantidadeParametros} parâmetros do template.`);
    const previaTemplate = template ? parametros.reduce((texto: string, valor: string, indice: number) => texto.split(`{{${indice + 1}}}`).join(valor), template.textoExibicao) : "";
    const mensagem = await db.$transaction(async (tx) => {
      const criada = await tx.mensagemMensageria.create({ data: {
        conversaId: conversa.id, canalMensageriaId: conversa.canalMensageriaId,
        mensagemExternaId: `atendente:${randomUUID()}`, direcao: "SAIDA", autor: "ATENDENTE", usuarioId: request.user.id,
        conteudo: previaTemplate || conteudo, tipoConteudo: "TEXTO", payload: template ? { template: { id: template.id, nome: template.nome, idioma: template.idioma, parametros } } : undefined, statusEntrega: "PENDENTE", enviadaEm: new Date(),
      } });
      await tx.conversaMensageria.update({ where: { id: conversa.id }, data: { atendenteId: conversa.atendenteId ?? request.user.id, estado: "EM_ATENDIMENTO", ultimaMensagemEm: criada.enviadaEm } });
      if (conversa.leadId) await tx.leadEvento.create({ data: { leadId: conversa.leadId, unidadeId: conversa.unidadeId, usuarioId: request.user.id, tipo: "MENSAGEM_ATENDENTE", descricao: "Mensagem enviada pelo atendimento.", payload: { conversaId: conversa.id } } });
      return criada;
    });
    await new DespacharMensagensService(db).enviarMensagem(mensagem.id);
    return response.status(201).json(await db.mensagemMensageria.findUnique({ where: { id: mensagem.id } }));
  }

  async listarTemplates(request: Request, response: Response) {
    const canalId = Number(request.query.canalId) || undefined;
    return response.json(await prismaDaRequisicao().templateMensageria.findMany({
      where: { unidadeId: requireUnidadeId(request), ...(request.query.todos === "true" ? {} : { ativo: true, status: "APPROVED", suportado: true }), ...(canalId ? { canalMensageriaId: canalId } : {}) },
      orderBy: [{ nome: "asc" }, { idioma: "asc" }],
      select: { id: true, canalMensageriaId: true, nome: true, idioma: true, textoExibicao: true, status: true, categoria: true, quantidadeParametros: true, suportado: true, sincronizadoEm: true },
    }));
  }

  async sincronizarTemplates(request: Request, response: Response) {
    const infra = infraestruturaMensageria();
    return response.json(await new SincronizarTemplatesMetaService(prismaDaRequisicao(), infra.segredos).executar(requireUnidadeId(request), Number(request.params.id)));
  }

  async sincronizarTodosTemplates(_request: Request, response: Response) {
    const infra = infraestruturaMensageria();
    return response.json(await new SincronizarTemplatesMetaService(prismaDaRequisicao(), infra.segredos).executarTodos());
  }

  async reenviarMensagem(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const mensagem = await db.mensagemMensageria.findUnique({ where: { id: Number(request.params.id) }, include: { conversa: { select: { unidadeId: true } } } });
    if (!mensagem || mensagem.direcao !== "SAIDA") throw new AppError("Mensagem não encontrada.", 404);
    garantirAcessoUnidade(request.user.unidadeId, mensagem.conversa.unidadeId, "Mensagem não encontrada.");
    if (mensagem.statusEntrega !== "FALHOU") throw new AppError("Somente mensagens com falha podem ser reenviadas.");
    await db.mensagemMensageria.update({ where: { id: mensagem.id }, data: { statusEntrega: "PENDENTE", erroEnvio: null, proximaTentativaEm: null, tentativasEnvio: 0 } });
    await new DespacharMensagensService(db).enviarMensagem(mensagem.id);
    return response.json(await db.mensagemMensageria.findUnique({ where: { id: mensagem.id } }));
  }

  async enviarAnexo(request: Request, response: Response) {
    if (!request.file) throw new AppError("Selecione um arquivo para enviar.");
    const db = prismaDaRequisicao();
    const mensagem = await new ArmazenarAnexoMensageriaService(db).executar({
      conversaId: Number(request.params.id), unidadeId: requireUnidadeId(request), usuarioId: request.user.id,
      buffer: request.file.buffer, mime: request.file.mimetype, nome: request.file.originalname,
      legenda: typeof request.body?.legenda === "string" ? request.body.legenda : undefined,
    });
    await new DespacharMensagensService(db).enviarMensagem(mensagem.id);
    return response.status(201).json(await db.mensagemMensageria.findUnique({ where: { id: mensagem.id } }));
  }

  async assumir(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const conversa = await db.conversaMensageria.findUnique({ where: { id: Number(request.params.id) } });
    if (!conversa) throw new AppError("Conversa não encontrada.", 404);
    garantirAcessoUnidade(request.user.unidadeId, conversa.unidadeId, "Conversa não encontrada.");
    return response.json(await db.conversaMensageria.update({ where: { id: conversa.id }, data: { atendenteId: request.user.id, estado: "EM_ATENDIMENTO" } }));
  }

  async encerrar(request: Request, response: Response) {
    const db = prismaDaRequisicao();
    const conversa = await db.conversaMensageria.findUnique({ where: { id: Number(request.params.id) } });
    if (!conversa) throw new AppError("Conversa não encontrada.", 404);
    garantirAcessoUnidade(request.user.unidadeId, conversa.unidadeId, "Conversa não encontrada.");
    return response.json(await db.conversaMensageria.update({ where: { id: conversa.id }, data: { estado: "ENCERRADA" } }));
  }

  async processar(_request: Request, response: Response) {
    return response.json(await new ProcessarEntradaService(prismaDaRequisicao()).executar());
  }

  async lembrar(_request: Request, response: Response) {
    return response.json(await new LembretesBotService(prismaDaRequisicao()).executar());
  }

  async despachar(_request: Request, response: Response) {
    return response.json(await new DespacharMensagensService(prismaDaRequisicao()).executar());
  }

  async processarMidias(_request: Request, response: Response) {
    return response.json(await new ProcessarMidiasMensageriaService(prismaDaRequisicao()).executar());
  }
}
