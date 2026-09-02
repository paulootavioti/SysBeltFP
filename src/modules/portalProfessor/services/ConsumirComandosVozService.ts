import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { GetAulaService } from "../../aulas/services/GetAulaService";

interface Solicitante { id: number; perfil: string; unidadeId: number | null }

export class ConsumirComandosVozService {
  async execute(aulaId: number, solicitante: Solicitante) {
    const db = prismaDaRequisicao();
    const aula = await new GetAulaService().execute(aulaId, solicitante);
    if (!aula.turma?.arenaId) return [];
    const pareamento = await db.pareamentoVozArena.findFirst({ where: { arenaId: aula.turma.arenaId, revogadoEm: null }, select: { id: true } });
    if (!pareamento) return [];
    return db.$transaction(async (tx) => {
      const eventos = await tx.eventoComandoVoz.findMany({ where: { pareamentoId: pareamento.id, consumidoEm: null, createdAt: { gte: new Date(Date.now() - 5 * 60_000) } }, orderBy: { createdAt: "asc" }, take: 10 });
      if (eventos.length) await tx.eventoComandoVoz.updateMany({ where: { id: { in: eventos.map((evento) => evento.id) }, consumidoEm: null }, data: { consumidoEm: new Date() } });
      return eventos.map(({ id, acao, duracaoBlocoSegundos, avisoAntesFimSegundos }) => ({ id, acao, duracaoBlocoSegundos, avisoAntesFimSegundos }));
    });
  }
}
