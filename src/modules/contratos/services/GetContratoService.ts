import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetContratoService {
  async execute(id: number, unidadeId: number | null) {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        aluno: { select: { id: true, nome: true, dataNascimento: true } },
        contratanteResponsavel: { select: { id: true, nome: true, cpf: true } },
        modeloContrato: { select: { id: true, nome: true, versao: true } },
        plano: { select: { id: true, nome: true } },
        formaPagamento: true,
        contratoAnterior: { select: { id: true, numero: true, situacao: true } },
        renovacoes: { select: { id: true, numero: true, situacao: true, createdAt: true } },
      },
    });

    if (!contrato) {
      throw new AppError("Contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, contrato.unidadeId, "Contrato não encontrado.");

    return contrato;
  }
}
