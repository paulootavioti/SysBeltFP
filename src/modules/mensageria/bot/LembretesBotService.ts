import type { PrismaClient } from "@prisma/client";

export class LembretesBotService {
  constructor(private readonly db: PrismaClient) {}

  async executar(limite = 100) {
    const sessoes = await this.db.botSessao.findMany({
      where: { finalizadoEm: null, lembreteEm: null, expiraEm: { lte: new Date() } },
      orderBy: { expiraEm: "asc" }, take: Math.min(Math.max(limite, 1), 100),
      include: { conversa: { select: { id: true, canalMensageriaId: true } } },
    });
    let lembradas = 0;
    for (const sessao of sessoes) {
      const reservada = await this.db.botSessao.updateMany({
        where: { id: sessao.id, lembreteEm: null, finalizadoEm: null }, data: { lembreteEm: new Date() },
      });
      if (!reservada.count) continue;
      await this.db.mensagemMensageria.createMany({
        data: [{
          conversaId: sessao.conversa.id, canalMensageriaId: sessao.conversa.canalMensageriaId,
          mensagemExternaId: `bot-lembrete:${sessao.id}`, direcao: "SAIDA", autor: "BOT", tipoConteudo: "TEXTO",
          conteudo: "Oi! Passando só para saber se você quer continuar. Quando puder, responda por aqui e seguimos do ponto em que paramos.",
          statusEntrega: "PENDENTE", enviadaEm: new Date(),
        }],
        skipDuplicates: true,
      });
      lembradas++;
    }
    return { encontradas: sessoes.length, lembradas };
  }
}
