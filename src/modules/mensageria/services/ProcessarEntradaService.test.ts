import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../../shared/database/prisma";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";
import { ProcessarEntradaService } from "./ProcessarEntradaService";
import { LembretesBotService } from "../bot/LembretesBotService";

const SUFIXO = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let unidadeId: number;
let canalId: number;

beforeAll(async () => {
  const unidade = await criarUnidadeDeTeste(`TESTE_MENSAGERIA_${SUFIXO}`);
  unidadeId = unidade.id;
  const canal = await prisma.canalMensageria.create({
    data: {
      unidadeId,
      tipo: "WHATSAPP",
      identificadorExterno: `phone-${SUFIXO}`,
      nomeExibicao: "WhatsApp teste",
      tokenRef: "env:META_TEST_TOKEN",
      verifyTokenRef: "env:META_TEST_VERIFY_TOKEN",
    },
  });
  canalId = canal.id;
});

afterAll(async () => {
  if (!canalId) return;
  await prisma.eventoMensageriaEntrada.deleteMany({ where: { canalMensageriaId: canalId } });
  await prisma.mensagemMensageria.deleteMany({ where: { canalMensageriaId: canalId } });
  await prisma.conversaMensageria.deleteMany({ where: { canalMensageriaId: canalId } });
  await prisma.leadConsentimento.deleteMany({ where: { lead: { unidadeId } } });
  await prisma.leadEvento.deleteMany({ where: { unidadeId } });
  await prisma.lead.deleteMany({ where: { unidadeId } });
  await prisma.canalMensageria.delete({ where: { id: canalId } });
  await prisma.botFluxo.deleteMany({ where: { unidadeId } });
  await prisma.canalCaptacao.deleteMany({ where: { unidadeId } });
  await prisma.usuario.deleteMany({ where: { unidadeId, email: { startsWith: "mensageria-" } } });
  await prisma.unidade.delete({ where: { id: unidadeId } });
});

describe("processamento transacional da inbox", () => {
  it("deduplica o webhook e persiste uma conversa e uma mensagem", async () => {
    const mensagem = {
      eventoExternoId: `wamid.${SUFIXO}`,
      contatoExternoId: "5511999990000",
      contatoNome: "Contato teste",
      conteudo: "Quero conhecer a academia",
      tipoConteudo: "TEXTO",
      enviadaEm: new Date().toISOString(),
      payload: { id: `wamid.${SUFIXO}`, type: "text" },
    };
    const insercao = await prisma.eventoMensageriaEntrada.createMany({
      data: [
        { canalMensageriaId: canalId, eventoExternoId: mensagem.eventoExternoId, payload: mensagem },
        { canalMensageriaId: canalId, eventoExternoId: mensagem.eventoExternoId, payload: mensagem },
      ],
      skipDuplicates: true,
    });
    expect(insercao.count).toBe(1);

    expect(await new ProcessarEntradaService(prisma).executar()).toMatchObject({ processados: 1 });
    expect(await new ProcessarEntradaService(prisma).executar()).toMatchObject({ processados: 0 });

    const conversa = await prisma.conversaMensageria.findUniqueOrThrow({
      where: { canalMensageriaId_contatoExternoId: { canalMensageriaId: canalId, contatoExternoId: mensagem.contatoExternoId } },
      include: { mensagens: true },
    });
    expect(conversa).toMatchObject({ unidadeId, contatoNome: "Contato teste", naoLidas: 1 });
    expect(conversa.mensagens.filter(({ direcao }) => direcao === "ENTRADA")).toHaveLength(1);
    expect(conversa.mensagens).toEqual(expect.arrayContaining([
      expect.objectContaining({ mensagemExternaId: mensagem.eventoExternoId, conteudo: mensagem.conteudo, direcao: "ENTRADA" }),
      expect.objectContaining({ autor: "BOT", direcao: "SAIDA", statusEntrega: "PENDENTE" }),
    ]));
  });

  it("qualifica, cria lead com consentimento, rodízio e SLA ao concluir o bot", async () => {
    const usuario = await prisma.usuario.create({
      data: { unidadeId, nome: "Recepção Bot", email: `mensageria-${SUFIXO}@teste.local`, senha: "nao-utilizada", perfil: "RECEPCAO" },
    });
    const contatoExternoId = "5511987654321";
    const entradas = ["oi", "Maria Bot", "Para mim", "Nunca treinei", "Noite", "Sim, autorizo"];
    for (const [indice, conteudo] of entradas.entries()) {
      const eventoExternoId = `wamid.fluxo.${SUFIXO}.${indice}`;
      await prisma.eventoMensageriaEntrada.create({ data: {
        canalMensageriaId: canalId, eventoExternoId,
        payload: { eventoExternoId, contatoExternoId, contatoNome: "Maria Bot", conteudo, tipoConteudo: "TEXTO", enviadaEm: new Date().toISOString(), payload: { id: eventoExternoId } },
      } });
      expect((await new ProcessarEntradaService(prisma).executar()).processados).toBe(1);
    }
    const conversa = await prisma.conversaMensageria.findUniqueOrThrow({
      where: { canalMensageriaId_contatoExternoId: { canalMensageriaId: canalId, contatoExternoId } },
      include: { lead: { include: { consentimentos: true, eventos: true } }, sessoesBot: true },
    });
    expect(conversa.estado).toBe("AGUARDANDO_EQUIPE");
    expect(conversa.sessoesBot[0]).toMatchObject({ passoAtual: "FINALIZADO" });
    expect(conversa.lead).toMatchObject({ nome: "Maria Bot", telefoneE164: contatoExternoId, responsavelUsuarioId: usuario.id, estagio: "NOVO" });
    expect(conversa.lead!.proximaAcaoEm!.getTime() - conversa.lead!.criadoEm.getTime()).toBeGreaterThanOrEqual(899_000);
    expect(conversa.lead!.consentimentos).toEqual([
      expect.objectContaining({ canalMensageriaId: canalId, finalidade: "TRATAMENTO_DADOS", versao: "2026-08-26" }),
    ]);
    expect(conversa.lead!.eventos).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: "CAPTADO_PELO_BOT" }), expect.objectContaining({ tipo: "TRANSFERIDO_PELO_BOT" }),
    ]));
  });

  it("gera somente um lembrete após 24 horas sem resposta", async () => {
    const sessao = await prisma.botSessao.findFirstOrThrow({
      where: { conversa: { canalMensageriaId: canalId, contatoExternoId: "5511999990000" }, finalizadoEm: null },
    });
    await prisma.botSessao.update({ where: { id: sessao.id }, data: { expiraEm: new Date(Date.now() - 1_000) } });
    expect(await new LembretesBotService(prisma).executar()).toMatchObject({ lembradas: 1 });
    expect(await new LembretesBotService(prisma).executar()).toMatchObject({ lembradas: 0 });
    expect(await prisma.mensagemMensageria.count({ where: { mensagemExternaId: `bot-lembrete:${sessao.id}` } })).toBe(1);
  });
});
