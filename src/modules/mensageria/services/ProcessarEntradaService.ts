import { Prisma, type PrismaClient } from "@prisma/client";
import type { MensagemMetaNormalizada } from "../metaPayload";
import { executarBotNoEvento } from "../bot/ExecutarBotService";

export class ProcessarEntradaService {
  constructor(private readonly db: PrismaClient) {}

  async executar(limite = 50) {
    const eventos = await this.db.eventoMensageriaEntrada.findMany({
      where: { status: { in: ["PENDENTE", "FALHOU"] }, OR: [{ proximaTentativaEm: null }, { proximaTentativaEm: { lte: new Date() } }] },
      orderBy: { criadoEm: "asc" }, take: Math.min(Math.max(limite, 1), 100),
      select: { id: true },
    });
    let processados = 0;
    for (const { id } of eventos) {
      const reservado = await this.db.eventoMensageriaEntrada.updateMany({
        where: { id, status: { in: ["PENDENTE", "FALHOU"] } }, data: { status: "PROCESSANDO", tentativas: { increment: 1 } },
      });
      if (!reservado.count) continue;
      try {
        await this.processar(id);
        processados++;
      } catch {
        await this.db.eventoMensageriaEntrada.update({
          where: { id }, data: { status: "FALHOU", erro: "Falha ao processar evento.", proximaTentativaEm: new Date(Date.now() + 60_000) },
        });
      }
    }
    return { encontrados: eventos.length, processados };
  }

  private async processar(id: number) {
    await this.db.$transaction(async (tx) => {
      const evento = await tx.eventoMensageriaEntrada.findUniqueOrThrow({
        where: { id }, include: { canalMensageria: { select: { unidadeId: true } } },
      });
      const mensagem = evento.payload as unknown as MensagemMetaNormalizada;
      const conversa = await tx.conversaMensageria.upsert({
        where: { canalMensageriaId_contatoExternoId: { canalMensageriaId: evento.canalMensageriaId, contatoExternoId: mensagem.contatoExternoId } },
        create: { unidadeId: evento.canalMensageria.unidadeId, canalMensageriaId: evento.canalMensageriaId, contatoExternoId: mensagem.contatoExternoId, contatoNome: mensagem.contatoNome, naoLidas: 0 },
        update: mensagem.contatoNome ? { contatoNome: mensagem.contatoNome } : {},
      });
      const criada = await tx.mensagemMensageria.createMany({
        data: [{ conversaId: conversa.id, canalMensageriaId: evento.canalMensageriaId, mensagemExternaId: mensagem.eventoExternoId,
          direcao: "ENTRADA", autor: "CONTATO", conteudo: mensagem.conteudo, tipoConteudo: mensagem.tipoConteudo,
          mediaExternaId: mensagem.mediaExternaId, mediaUrlOrigem: mensagem.mediaUrlOrigem, arquivoNome: mensagem.arquivoNome,
          mediaStatus: mensagem.mediaExternaId || mensagem.mediaUrlOrigem ? "PENDENTE" : null,
          payload: mensagem.payload as Prisma.InputJsonValue, statusEntrega: "RECEBIDA", enviadaEm: new Date(mensagem.enviadaEm) }], skipDuplicates: true,
      });
      if (criada.count) await tx.conversaMensageria.update({
        where: { id: conversa.id }, data: { naoLidas: { increment: 1 }, ultimaMensagemEm: new Date(mensagem.enviadaEm) },
      });
      if (criada.count) await executarBotNoEvento(tx, {
        conversaId: conversa.id,
        canalMensageriaId: evento.canalMensageriaId,
        eventoExternoId: mensagem.eventoExternoId,
        conteudo: mensagem.conteudo,
      });
      await tx.eventoMensageriaEntrada.update({ where: { id }, data: { status: "CONCLUIDO", processadoEm: new Date(), erro: null } });
    });
  }
}
