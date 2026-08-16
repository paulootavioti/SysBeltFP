import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CobrancaDTO {
  valor: number;
  vencimento: string;
}

interface AprovarGraduacaoDTO {
  id: number;
  revisorId: number;
  unidadeIdRevisor: number | null;
  cobranca?: CobrancaDTO;
}

export class AprovarGraduacaoService {
  async execute({ id, revisorId, unidadeIdRevisor, cobranca }: AprovarGraduacaoDTO) {
    const prisma = prismaDaRequisicao();
    const graduacao = await prisma.graduacao.findUnique({
      where: { id },
      include: { aluno: true },
    });

    if (!graduacao) {
      throw new AppError("Solicitação de graduação não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeIdRevisor, graduacao.unidadeId, "Solicitação de graduação não encontrada.");

    if (graduacao.status !== "pendente") {
      throw new AppError("Só é possível aprovar uma solicitação pendente.");
    }

    const [graduacaoAprovada] = await prisma.$transaction([
      prisma.graduacao.update({
        where: { id },
        data: {
          status: "aprovada",
          revisadoPorId: revisorId,
          revisadoEm: new Date(),
        },
      }),
      prisma.aluno.update({
        where: { id: graduacao.alunoId },
        data: { faixa: graduacao.faixa },
      }),
      ...(cobranca
        ? [
            prisma.mensalidade.create({
              data: {
                unidadeId: graduacao.unidadeId,
                valor: cobranca.valor,
                vencimento: new Date(cobranca.vencimento),
                alunoId: graduacao.alunoId,
                descricao: `Troca de faixa - ${graduacao.faixa}`,
              },
            }),
          ]
        : []),
    ]);

    return graduacaoAprovada;
  }
}
