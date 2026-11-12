import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { logger } from "../../shared/observability/logger";

// A concessão só se renova quando o Control Plane manda uma nova. Se a
// renovação não chegar (falha de integração, cobrança travada), a conta
// cai sozinha em somente leitura e perde os recursos do plano. Este
// aviso diário dá uma semana para agir antes disso.
export const DIAS_AVISO_VENCIMENTO = 7;

export class VerificarConcessoesService {
  async execute(agora = new Date()): Promise<{ vencendo: number; vencidas: number }> {
    const limite = new Date(agora.getTime() + DIAS_AVISO_VENCIMENTO * 24 * 60 * 60_000);
    const concessoes = await prismaDaRequisicao().concessaoPlataforma.findMany({
      where: { statusAcesso: "ATIVO", expiraEm: { lte: limite } },
      select: { contaId: true, tenantKey: true, revisao: true, expiraEm: true },
      orderBy: { expiraEm: "asc" },
    });

    let vencidas = 0;
    for (const concessao of concessoes) {
      const dados = {
        contaId: concessao.contaId,
        tenantKey: concessao.tenantKey,
        revisao: concessao.revisao,
        expiraEm: concessao.expiraEm.toISOString(),
      };
      if (concessao.expiraEm <= agora) {
        vencidas += 1;
        logger.error("concessao_vencida", new Error("Concessão ativa vencida sem renovação do Control Plane."), dados);
      } else {
        logger.warn("concessao_vencendo", dados);
      }
    }
    return { vencendo: concessoes.length - vencidas, vencidas };
  }
}
