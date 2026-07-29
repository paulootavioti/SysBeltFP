import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateAssinaturaDTO {
  planoId?: number | null;
  formaPagamentoId?: number | null;
  valor: number;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string | null;
  indeterminado: boolean;
  numeroParcelas?: number | null;
  desconto?: number | null;
  acrescimo?: number | null;
  multa?: number | null;
  juros?: number | null;
  descontoPontualidade?: number | null;
}

export class UpdateAssinaturaService {
  async execute(id: number, data: UpdateAssinaturaDTO, unidadeId: number | null) {
    const assinatura = await prisma.assinatura.findUnique({ where: { id } });

    if (!assinatura) {
      throw new AppError("Assinatura não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, assinatura.unidadeId, "Assinatura não encontrada.");

    return prisma.assinatura.update({
      where: { id },
      data: {
        planoId: data.planoId ?? null,
        formaPagamentoId: data.formaPagamentoId ?? null,
        valor: data.valor,
        diaVencimento: data.diaVencimento,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        indeterminado: data.indeterminado,
        numeroParcelas: data.indeterminado ? null : data.numeroParcelas,
        desconto: data.desconto ?? 0,
        acrescimo: data.acrescimo ?? 0,
        multa: data.multa ?? 0,
        juros: data.juros ?? 0,
        descontoPontualidade: data.descontoPontualidade ?? 0,
      },
    });
  }
}
