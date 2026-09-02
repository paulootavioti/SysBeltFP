import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { PASSOS_PADRAO, normalizarPassosBot, validarPassosBot } from "../bot/fluxoBot";

function proximaVersao(atual?: string) {
  const partes = atual?.match(/^(\d+)\.(\d+)\.(\d+)$/);
  return partes ? `${partes[1]}.${partes[2]}.${Number(partes[3]) + 1}` : "1.0.0";
}

export class FluxosBotService {
  constructor(private readonly db: PrismaClient) {}

  async obter(unidadeId: number) {
    let fluxo = await this.db.botFluxo.findFirst({ where: { unidadeId, ativo: true }, orderBy: { criadoEm: "desc" } });
    fluxo ??= await this.db.botFluxo.create({ data: { unidadeId, nome: "Captação padrão", versao: "1.0.0", passos: PASSOS_PADRAO as unknown as Prisma.InputJsonValue } });
    return { ...fluxo, passos: normalizarPassosBot(fluxo.passos) };
  }

  async publicar(unidadeId: number, dados: { nome?: unknown; passos?: unknown }) {
    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    if (!nome || nome.length > 80) throw new AppError("Informe um nome com até 80 caracteres para o fluxo.");
    const passos = validarPassosBot(dados.passos);
    return this.db.$transaction(async (tx) => {
      const atual = await tx.botFluxo.findFirst({ where: { unidadeId, ativo: true }, orderBy: { criadoEm: "desc" } });
      const versao = proximaVersao(atual?.versao);
      await tx.botFluxo.updateMany({ where: { unidadeId, ativo: true }, data: { ativo: false } });
      const fluxo = await tx.botFluxo.create({ data: { unidadeId, nome, versao, passos: passos as unknown as Prisma.InputJsonValue } });
      return { ...fluxo, passos };
    });
  }
}
