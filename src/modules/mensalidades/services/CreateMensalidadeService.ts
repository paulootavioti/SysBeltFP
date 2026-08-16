import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { garantirSemMensalidadeNoMes } from "../utils/garantirSemMensalidadeNoMes";
import { calcularValorFinal } from "../utils/calcularValorFinal";

interface CreateMensalidadeDTO {
  valor: number;
  vencimento: string;
  alunoId: number;
  descricao?: string | null;
  formaPagamentoId?: number | null;
  desconto?: number | null;
  acrescimo?: number | null;
  multa?: number | null;
  juros?: number | null;
  unidadeIdUsuario: number | null;
  usuarioId: number;
}

const auditLogService = new AuditLogService();

export class CreateMensalidadeService {

  async execute({
    valor,
    vencimento,
    alunoId,
    descricao,
    formaPagamentoId,
    desconto,
    acrescimo,
    multa,
    juros,
    unidadeIdUsuario,
    usuarioId,
  }: CreateMensalidadeDTO) {
    const prisma = prismaDaRequisicao();

    await garantirSemMensalidadeNoMes(alunoId, vencimento);

    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { unidadeId: true },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, aluno.unidadeId, "Aluno não encontrado.");

    const valorFinal = calcularValorFinal({ valor, desconto, acrescimo, multa, juros });

    const mensalidade =
      await prisma.mensalidade.create({
        data: {
          unidadeId: aluno.unidadeId,
          valor,
          vencimento: new Date(vencimento),
          alunoId,
          descricao: descricao?.trim() || "Mensalidade",
          formaPagamentoId: formaPagamentoId ?? null,
          valorOriginal: valor,
          desconto: desconto ?? 0,
          acrescimo: acrescimo ?? 0,
          multa: multa ?? 0,
          juros: juros ?? 0,
          valorFinal,
        }
      });

    await auditLogService.registrar({
      unidadeId: aluno.unidadeId,
      usuarioId,
      entidade: "Mensalidade",
      entidadeId: mensalidade.id,
      operacao: "CRIACAO",
      valoresDepois: mensalidade,
    });

    return mensalidade;
  }
}
