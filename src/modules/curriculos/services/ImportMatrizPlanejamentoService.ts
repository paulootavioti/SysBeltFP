import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { matrizPlanejamentoImportacaoSchema } from "../validation";
import { dadosParaCriarCurriculo } from "./ImportCurriculoService";

export class ImportMatrizPlanejamentoService {
  async execute(payload: unknown, unidadeId: number) {
    const dados = matrizPlanejamentoImportacaoSchema.parse(payload);
    const prisma = prismaDaRequisicao();

    return prisma.$transaction(async (tx) => {
      const modalidades = await tx.modalidade.findMany({ where: { unidadeId }, select: { id: true, nome: true } });
      const porNome = new Map(modalidades.map((modalidade) => [modalidade.nome.toLocaleLowerCase("pt-BR"), modalidade.id]));
      const avisos: string[] = [];
      const curriculos = [];

      for (const curriculo of dados.matriz.curriculos) {
        const chaveModalidade = curriculo.modalidadeNome?.toLocaleLowerCase("pt-BR");
        const modalidadeId = chaveModalidade ? porNome.get(chaveModalidade) ?? null : null;
        if (chaveModalidade && modalidadeId === null) avisos.push(`A modalidade "${curriculo.modalidadeNome}" não existe nesta unidade; "${curriculo.nome}" foi importado sem modalidade.`);
        const criado = await tx.curriculo.create({ data: dadosParaCriarCurriculo(curriculo, unidadeId, modalidadeId), select: { id: true, nome: true } });
        curriculos.push(criado);
      }

      return { matriz: dados.matriz.nome, curriculos, avisos };
    });
  }
}
