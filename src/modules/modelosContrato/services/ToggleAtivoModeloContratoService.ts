import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoModeloContratoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modelo = await prisma.modeloContrato.findUnique({ where: { id } });

    if (!modelo) {
      throw new AppError("Modelo de contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modelo.unidadeId, "Modelo de contrato não encontrado.");

    return prisma.modeloContrato.update({
      where: { id },
      data: { ativo: !modelo.ativo },
    });
  }
}
