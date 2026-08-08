import { prisma } from "../../../shared/database/prisma";
import type { StatusEntrega } from "../providers/MessagingProvider";

// A Meta manda o ciclo de vida em eventos separados: sent, delivered,
// read. Eles podem chegar fora de ordem — não dá pra sobrescrever "lida"
// com "entregue" só porque o webhook atrasou.
const PESO: Record<StatusEntrega["situacao"], number> = {
  ENVIADA: 1,
  ENTREGUE: 2,
  LIDA: 3,
  // falha é terminal: se falhou, não vira entregue depois.
  FALHOU: 4,
};

export class AtualizarEntregaService {
  async execute(atualizacoes: StatusEntrega[]): Promise<{ aplicadas: number }> {
    let aplicadas = 0;

    for (const atualizacao of atualizacoes) {
      const mensagem = await prisma.mensagemWhatsapp.findFirst({
        where: { provedorMensagemId: atualizacao.provedorMensagemId },
      });

      // Mensagem que não é nossa (outro sistema no mesmo número) ou
      // status que chegou antes do envio ser gravado.
      if (!mensagem) continue;

      const atual = PESO[mensagem.status as StatusEntrega["situacao"]] ?? 0;

      if (PESO[atualizacao.situacao] <= atual) continue;

      await prisma.mensagemWhatsapp.update({
        where: { id: mensagem.id },
        data: {
          status: atualizacao.situacao,
          erro: atualizacao.erro ?? mensagem.erro,
          ...(atualizacao.situacao === "ENTREGUE" ? { entregueEm: atualizacao.ocorridoEm } : {}),
          ...(atualizacao.situacao === "LIDA" ? { lidaEm: atualizacao.ocorridoEm } : {}),
        },
      });

      aplicadas += 1;
    }

    return { aplicadas };
  }
}
