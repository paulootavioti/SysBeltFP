import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateAssinaturaDTO {
  unidadeId: number;
  alunoId: number;
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

export class CreateAssinaturaService {
  async execute(data: CreateAssinaturaDTO) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({
      where: { id: data.alunoId },
      select: { unidadeId: true },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(data.unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    return prisma.assinatura.create({
      data: {
        unidadeId: aluno.unidadeId,
        alunoId: data.alunoId,
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
