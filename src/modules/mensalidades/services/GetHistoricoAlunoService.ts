import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

// Histórico financeiro do aluno: todas as mensalidades (com forma de
// pagamento) e o log de auditoria de cada uma, mais recente primeiro.
export class GetHistoricoAlunoService {

  async execute(alunoId: number, unidadeId: number | null) {

    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { id: true, nome: true, unidadeId: true },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const mensalidades = await prisma.mensalidade.findMany({
      where: { alunoId },
      include: { formaPagamento: true },
      orderBy: { vencimento: "desc" },
    });

    const auditoria = await prisma.auditLog.findMany({
      where: {
        entidade: "Mensalidade",
        entidadeId: { in: mensalidades.map((m) => m.id) },
      },
      include: { usuario: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      aluno: { id: aluno.id, nome: aluno.nome },
      mensalidades,
      auditoria,
    };
  }
}
