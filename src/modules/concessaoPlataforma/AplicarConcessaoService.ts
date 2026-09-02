import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { concessaoV1Schema, validarConcessao } from "./concessaoContrato";

export class AplicarConcessaoService {
  async execute(entrada: unknown, agora = new Date()): Promise<{ revisao: number; duplicada: boolean }> {
    const prisma = prismaDaRequisicao();
    const chavePublica = process.env.CONTROL_PLANE_GRANT_PUBLIC_KEY?.replace(/\\n/g, "\n").trim();
    if (!chavePublica) throw new Error("Validação de concessão não configurada.");

    const identificacao = concessaoV1Schema.parse(entrada);
    const conta = await prisma.conta.findUnique({ where: { tenantKey: identificacao.tenantKey }, select: { id: true, tenantKey: true } });
    if (!conta) throw new Error("Concessão pertence a outro tenant.");
    const { concessao, payloadHash } = validarConcessao(entrada, conta.tenantKey, chavePublica, agora);
    return prisma.$transaction(async (tx) => {
      const atual = await tx.concessaoPlataforma.findUnique({ where: { contaId: conta.id } });
      if (atual && concessao.revisao < atual.revisao) {
        throw new Error("Concessão mais antiga que a revisão local.");
      }
      if (atual && concessao.revisao === atual.revisao) {
        if (atual.payloadHash !== payloadHash) throw new Error("Conflito na revisão da concessão.");
        return { revisao: atual.revisao, duplicada: true };
      }

      await tx.concessaoPlataforma.upsert({
        where: { contaId: conta.id },
        create: {
          contaId: conta.id, tenantKey: concessao.tenantKey, statusAcesso: concessao.statusAcesso,
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
