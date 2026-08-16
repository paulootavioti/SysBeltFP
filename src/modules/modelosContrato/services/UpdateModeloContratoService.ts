import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateModeloContratoDTO {
  nome: string;
  conteudo: string;
}

// Edição simples, em cima da mesma linha — não mexe em versionamento.
// Contratos já gerados não são afetados: eles guardam um snapshot em
// Contrato.conteudoGerado, não uma referência viva ao texto do modelo.
export class UpdateModeloContratoService {
  async execute(id: number, unidadeId: number | null, data: UpdateModeloContratoDTO) {
    const prisma = prismaDaRequisicao();
    const modelo = await prisma.modeloContrato.findUnique({ where: { id } });

    if (!modelo) {
      throw new AppError("Modelo de contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modelo.unidadeId, "Modelo de contrato não encontrado.");

    return prisma.modeloContrato.update({
      where: { id },
      data: {
        nome: data.nome,
        conteudo: data.conteudo,
      },
    });
  }
}
