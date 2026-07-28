import { prisma } from "../../../shared/database/prisma";

// unidades vinculadas ao usuário autenticado — usado pelo seletor de
// "unidade ativa" de um ADMIN/RECEPCAO vinculado a mais de uma unidade.
export class ListMinhasUnidadesService {
  async execute(usuarioId: number) {
    const vinculos = await prisma.usuarioUnidade.findMany({
      where: { usuarioId },
      select: { unidade: { select: { id: true, nome: true } } },
      orderBy: { unidade: { nome: "asc" } },
    });

    return vinculos.map((vinculo) => vinculo.unidade);
  }
}
