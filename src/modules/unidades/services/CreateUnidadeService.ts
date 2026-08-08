import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface CreateUnidadeDTO {
  nome: string;
  contaId: number;
}

// Uma filial nova nasce sempre dentro de uma conta — é o que impede que
// unidades de assinantes diferentes acabem no mesmo balaio. Quem é ADMIN
// abre filial na própria conta (resolvida pela unidade ativa, no
// controller); o SUPERADMIN precisa dizer em qual conta.
export class CreateUnidadeService {
  async execute(data: CreateUnidadeDTO) {
    const conta = await prisma.conta.findUnique({ where: { id: data.contaId } });

    if (!conta) {
      throw new AppError("Conta não encontrada.", 404);
    }

    return prisma.unidade.create({
      data: { nome: data.nome.trim(), contaId: data.contaId },
    });
  }
}
