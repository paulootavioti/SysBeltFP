import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

// versão enxuta (id/nome/apelido) dos professores ativos da unidade — usada
// pelo seletor de professor substituto na transferência de aula, acessível
// também a PROFESSOR (que não pode listar /usuarios, restrito a ADMIN).
export class ListProfessoresService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.usuario.findMany({
      where: { ...escopoUnidade(unidadeId), perfil: "PROFESSOR", ativo: true },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    });
  }
}
