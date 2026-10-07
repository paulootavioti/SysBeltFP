import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { curriculoExportInclude, serializarCurriculo } from "./ExportCurriculoService";

export class ExportMatrizPlanejamentoService {
  async execute(unidadeId: number) {
    const curriculos = await prismaDaRequisicao().curriculo.findMany({
      where: { unidadeId },
      orderBy: { nome: "asc" },
      include: curriculoExportInclude,
    });

    return {
      schema: "sysbelt-matriz-planejamento" as const,
      versao: 1 as const,
      exportadoEm: new Date().toISOString(),
      matriz: {
        nome: "Matriz de planejamentos",
        curriculos: curriculos.map(serializarCurriculo),
      },
    };
  }
}
