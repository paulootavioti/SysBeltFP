import { prisma } from "../../../shared/database/prisma";
import { garantirSemMensalidadeNoMes } from "../utils/garantirSemMensalidadeNoMes";

interface CreateMensalidadeDTO {
  valor: number;
  vencimento: string;
  alunoId: number;
  descricao?: string | null;
}

export class CreateMensalidadeService {

  async execute({
    valor,
    vencimento,
    alunoId,
    descricao
  }: CreateMensalidadeDTO) {

    await garantirSemMensalidadeNoMes(alunoId, vencimento);

    const mensalidade =
      await prisma.mensalidade.create({
        data: {
          valor,
          vencimento: new Date(vencimento),
          alunoId,
          descricao: descricao?.trim() || "Mensalidade"
        }
      });

    return mensalidade;
  }
}