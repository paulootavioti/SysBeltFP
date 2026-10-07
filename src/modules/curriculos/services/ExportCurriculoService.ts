import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export const curriculoExportInclude = {
  modalidade: { select: { nome: true } },
  modulos: {
    orderBy: { ordem: "asc" as const },
    include: {
      aulas: {
        orderBy: { ordem: "asc" as const },
        include: {
          blocos: { orderBy: { ordem: "asc" as const } },
          tecnicas: { orderBy: { ordem: "asc" as const } },
        },
      },
    },
  },
} satisfies Prisma.CurriculoInclude;

type CurriculoExportavel = Prisma.CurriculoGetPayload<{ include: typeof curriculoExportInclude }>;

export function serializarCurriculo(curriculo: CurriculoExportavel) {
  return {
    nome: curriculo.nome,
    descricao: curriculo.descricao,
    publico: curriculo.publico,
    modalidadeNome: curriculo.modalidade?.nome ?? null,
    modulos: curriculo.modulos.map((modulo) => ({
      nome: modulo.nome,
      descricao: modulo.descricao,
      faixa: modulo.faixa,
      idadeMinima: modulo.idadeMinima,
      idadeMaxima: modulo.idadeMaxima,
      ordem: modulo.ordem,
      aulas: modulo.aulas.map((aula) => ({
        titulo: aula.titulo,
        objetivo: aula.objetivo,
        descricao: aula.descricao,
        duracaoMinutos: aula.duracaoMinutos,
        jogosSugeridos: aula.jogosSugeridos,
        ordem: aula.ordem,
        blocos: aula.blocos.map(({ id: _id, aulaCurriculoId: _aulaCurriculoId, conteudoTecnicoId: _conteudoTecnicoId, createdAt: _createdAt, updatedAt: _updatedAt, ...bloco }) => bloco),
        tecnicas: aula.tecnicas.map(({ id: _id, aulaCurriculoId: _aulaCurriculoId, createdAt: _createdAt, updatedAt: _updatedAt, ...tecnica }) => tecnica),
      })),
    })),
  };
}

export class ExportCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const curriculo = await prismaDaRequisicao().curriculo.findUnique({
      where: { id },
      include: curriculoExportInclude,
    });

    if (!curriculo) throw new AppError("Currículo não encontrado.");
    garantirAcessoUnidade(unidadeId, curriculo.unidadeId, "Currículo não encontrado.");

    return {
      schema: "sysbelt-planejamento" as const,
      versao: 1 as const,
      exportadoEm: new Date().toISOString(),
      curriculo: serializarCurriculo(curriculo),
    };
  }
}
