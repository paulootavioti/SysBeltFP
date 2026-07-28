import { prisma } from "../../../shared/database/prisma";

// Versão enxuta de ListUnidadesService — só id/nome das unidades ativas,
// pra popular seletores (ex.: consulta de grade horária de outra unidade)
// sem expor os dados completos de todas as unidades pra quem não é SUPERADMIN.
export class ListUnidadesOpcoesService {
  async execute() {
    return prisma.unidade.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}
