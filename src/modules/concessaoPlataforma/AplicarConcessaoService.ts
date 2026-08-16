import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { validarConcessao } from "./concessaoContrato";

export class AplicarConcessaoService {
  async execute(entrada: unknown, agora = new Date()): Promise<{ revisao: number; duplicada: boolean }> {
    const prisma = prismaDaRequisicao();
    const tenantKey = process.env.TENANT_KEY?.trim();
    const chavePublica = process.env.CONTROL_PLANE_GRANT_PUBLIC_KEY?.replace(/\\n/g, "\n").trim();
    if (!tenantKey || !chavePublica) throw new Error("Validação de concessão não configurada.");

    const { concessao, payloadHash } = validarConcessao(entrada, tenantKey, chavePublica, agora);
    return prisma.$transaction(async (tx) => {
      const atual = await tx.concessaoPlataforma.findUnique({ where: { id: 1 } });
      if (atual && concessao.revisao < atual.revisao) {
        throw new Error("Concessão mais antiga que a revisão local.");
      }
      if (atual && concessao.revisao === atual.revisao) {
        if (atual.payloadHash !== payloadHash) throw new Error("Conflito na revisão da concessão.");
        return { revisao: atual.revisao, duplicada: true };
      }

      await tx.concessaoPlataforma.upsert({
        where: { id: 1 },
        create: {
          id: 1, tenantKey: concessao.tenantKey, statusAcesso: concessao.statusAcesso,
          recursos: concessao.recursos, versaoContrato: concessao.versao, revisao: concessao.revisao,
          emitidaEm: new Date(concessao.emitidaEm), expiraEm: new Date(concessao.expiraEm),
          payloadHash, assinaturaBase64: concessao.assinatura, sincronizadaEm: agora,
        },
        update: {
          tenantKey: concessao.tenantKey, statusAcesso: concessao.statusAcesso,
          recursos: concessao.recursos, versaoContrato: concessao.versao, revisao: concessao.revisao,
          emitidaEm: new Date(concessao.emitidaEm), expiraEm: new Date(concessao.expiraEm),
          payloadHash, assinaturaBase64: concessao.assinatura, sincronizadaEm: agora,
        },
      });
      return { revisao: concessao.revisao, duplicada: false };
    });
  }
}
