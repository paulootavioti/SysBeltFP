import { TipoBlocoAulaCurriculo } from "@prisma/client";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateAulaAssistidaDTO {
  moduloId: number;
  titulo: string;
  objetivo?: string | null;
  descricao?: string | null;
  templateId?: number | null;
  conteudoIds: number[];
  substituirEtapasTecnicas?: boolean;
}

function tipoDoConteudo(tipo: string): TipoBlocoAulaCurriculo {
  if (["AQUECIMENTO", "MOBILIDADE", "PREPARACAO_FISICA"].includes(tipo)) return "AQUECIMENTO";
  if (["RECUPERACAO", "SEGURANCA"].includes(tipo)) return "PAUSA";
  return "TECNICA";
}

export class CreateAulaAssistidaService {
  async execute(data: CreateAulaAssistidaDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modulo = await prisma.moduloCurriculo.findUnique({
      where: { id: data.moduloId },
      include: { curriculo: { include: { modalidade: { select: { bibliotecaModalidadeId: true } } } } },
    });
    if (!modulo) throw new AppError("Módulo não encontrado.", 404);
    garantirAcessoUnidade(unidadeId, modulo.curriculo.unidadeId, "Módulo não encontrado.");

    const modalidadeBibliotecaId = modulo.curriculo.modalidade?.bibliotecaModalidadeId;
    if (!modalidadeBibliotecaId) {
      throw new AppError("Vincule a modalidade do currículo à biblioteca pedagógica antes de criar uma aula assistida.", 422);
    }

    const ids = [...new Set(data.conteudoIds)];
    if (!ids.length) throw new AppError("Selecione ao menos um conteúdo técnico.", 422);
    const conteudos = await prisma.conteudoTecnico.findMany({
      where: { id: { in: ids }, ativo: true, modalidadeId: modalidadeBibliotecaId, OR: [{ unidadeId: null }, { unidadeId: modulo.curriculo.unidadeId }] },
      orderBy: { nome: "asc" },
    });
    if (conteudos.length !== ids.length) throw new AppError("Um conteúdo não pertence à modalidade ou não está disponível para esta academia.", 422);

    const template = data.templateId
      ? await prisma.templatePlanejamento.findFirst({
        where: { id: data.templateId, ativo: true, OR: [{ unidadeId: null }, { unidadeId: modulo.curriculo.unidadeId }], AND: [{ OR: [{ modalidadeId: null }, { modalidadeId: modalidadeBibliotecaId }] }] },
        include: { etapas: { orderBy: { ordem: "asc" } } },
      })
      : null;
    if (data.templateId && !template) throw new AppError("Modelo de planejamento não está disponível para esta modalidade.", 422);

    const etapasTemplate = (template?.etapas ?? []).filter((etapa) => !(data.substituirEtapasTecnicas && etapa.tipo === "TECNICA"));
    const blocos = [
      ...etapasTemplate.map((etapa, ordem) => ({
        tipo: etapa.tipo,
        nome: etapa.titulo,
        ordem,
        duracaoPrevistaSegundos: etapa.duracaoSegundos,
        descricao: etapa.descricao,
      })),
      ...conteudos.map((conteudo, indice) => ({
        tipo: tipoDoConteudo(conteudo.tipo),
        nome: conteudo.nome,
        ordem: etapasTemplate.length + indice,
        duracaoPrevistaSegundos: conteudo.duracaoSugeridaSegundos,
        descricao: conteudo.passoAPasso ?? conteudo.descricao,
        atencoesFaixaEtaria: [conteudo.pontosAtencao, conteudo.cuidados].filter(Boolean).join("\n") || null,
        conteudoTecnicoId: conteudo.id,
      })),
    ];
    const duracaoMinutos = Math.ceil(blocos.reduce((total, bloco) => total + bloco.duracaoPrevistaSegundos, 0) / 60);

    return prisma.aulaCurriculo.create({
      data: {
        moduloId: modulo.id,
        titulo: data.titulo.trim(),
        objetivo: data.objetivo ?? (conteudos.map((conteudo) => conteudo.objetivo).filter(Boolean).join("; ") || null),
        descricao: data.descricao ?? null,
        duracaoMinutos,
        templatePlanejamentoId: template?.id,
        templateAplicadoEm: template ? new Date() : null,
        blocos: { create: blocos },
      },
      include: { blocos: { orderBy: { ordem: "asc" } }, templatePlanejamento: { include: { etapas: { orderBy: { ordem: "asc" } } } } },
    });
  }
}
