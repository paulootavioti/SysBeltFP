import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

// Cria uma nova versão a partir de um modelo existente — mantém o modelo
// anterior intacto (contratos já emitidos com ele continuam válidos, já
// que guardam um snapshot do conteúdo) e encadeia a nova linha via
// modeloOrigemId, com versao = versão anterior + 1.
export class VersionarModeloContratoService {
  async execute(id: number, unidadeId: number | null) {
    const modeloOrigem = await prisma.modeloContrato.findUnique({ where: { id } });

    if (!modeloOrigem) {
      throw new AppError("Modelo de contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modeloOrigem.unidadeId, "Modelo de contrato não encontrado.");

    return prisma.modeloContrato.create({
      data: {
        unidadeId: modeloOrigem.unidadeId,
        nome: modeloOrigem.nome,
        conteudo: modeloOrigem.conteudo,
        versao: modeloOrigem.versao + 1,
        modeloOrigemId: modeloOrigem.id,
      },
    });
  }
}
