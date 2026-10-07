import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { curriculoImportacaoSchema } from "../validation";

export function dadosParaCriarCurriculo(dados: ReturnType<typeof curriculoImportacaoSchema.parse>["curriculo"], unidadeId: number, modalidadeId: number | null) {
  return {
    unidadeId,
    nome: dados.nome,
    descricao: dados.descricao ?? null,
    publico: dados.publico || "Kids",
    modalidadeId,
    modulos: {
      create: dados.modulos.map((modulo) => ({
        nome: modulo.nome,
        descricao: modulo.descricao ?? null,
        faixa: modulo.faixa ?? null,
        idadeMinima: modulo.idadeMinima ?? null,
        idadeMaxima: modulo.idadeMaxima ?? null,
        ordem: modulo.ordem,
        aulas: {
          create: modulo.aulas.map((aula) => ({
            titulo: aula.titulo,
            objetivo: aula.objetivo ?? null,
            descricao: aula.descricao ?? null,
            duracaoMinutos: aula.duracaoMinutos ?? null,
            jogosSugeridos: aula.jogosSugeridos ?? null,
            ordem: aula.ordem,
            blocos: { create: aula.blocos.map((bloco) => ({ ...bloco, rounds: bloco.rounds ?? null, duracaoRoundSegundos: bloco.duracaoRoundSegundos ?? null, descansoSegundos: bloco.descansoSegundos ?? null, anuncio: bloco.anuncio ?? null, descricao: bloco.descricao ?? null, atencoesFaixaEtaria: bloco.atencoesFaixaEtaria ?? null })) },
            tecnicas: { create: aula.tecnicas.map((tecnica) => ({ ...tecnica, categoria: tecnica.categoria ?? null, descricao: tecnica.descricao ?? null, obrigatoria: tecnica.obrigatoria ?? true })) },
          })),
        },
      })),
    },
  };
}

export class ImportCurriculoService {
  async execute(payload: unknown, unidadeId: number) {
    const dados = curriculoImportacaoSchema.parse(payload);
    const prisma = prismaDaRequisicao();
    const avisos: string[] = [];
    let modalidadeId: number | null = null;

    if (dados.curriculo.modalidadeNome) {
      const modalidade = await prisma.modalidade.findFirst({
        where: { unidadeId, nome: { equals: dados.curriculo.modalidadeNome, mode: "insensitive" } },
        select: { id: true },
      });
      modalidadeId = modalidade?.id ?? null;
      if (!modalidade) avisos.push(`A modalidade "${dados.curriculo.modalidadeNome}" não existe nesta unidade; o currículo foi importado sem modalidade.`);
    }

    const curriculo = await prisma.$transaction(async (tx) => tx.curriculo.create({
      data: dadosParaCriarCurriculo(dados.curriculo, unidadeId, modalidadeId),
      include: { modulos: { include: { aulas: { include: { blocos: true, tecnicas: true } } } } },
    }));

    return { curriculo, avisos };
  }
}
