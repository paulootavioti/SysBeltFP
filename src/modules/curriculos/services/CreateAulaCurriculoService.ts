import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateAulaCurriculoDTO {
  titulo: string;
  objetivo?: string;
  descricao?: string;
  duracaoMinutos?: number;
  jogosSugeridos?: string;
  ordem?: number;
  moduloId: number;
  blocos?: Array<{
    tipo: "AQUECIMENTO" | "JOGO" | "TECNICA" | "SPARRING" | "PAUSA" | "ALONGAMENTO";
    nome: string;
    ordem: number;
    duracaoPrevistaSegundos: number;
    rounds?: number | null;
    duracaoRoundSegundos?: number | null;
    descansoSegundos?: number | null;
    anuncio?: string | null;
    descricao?: string | null;
    atencoesFaixaEtaria?: string | null;
    conteudoTecnicoId?: number | null;
  }>;
}

export class CreateAulaCurriculoService {
  async execute(data: CreateAulaCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modulo = await prisma.moduloCurriculo.findUnique({
      where: { id: data.moduloId },
      include: { curriculo: true },
    });

    if (!modulo) {
      throw new AppError("Módulo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modulo.curriculo.unidadeId, "Módulo não encontrado.");

    const conteudoIds = [...new Set((data.blocos ?? []).flatMap((bloco) => bloco.conteudoTecnicoId ? [bloco.conteudoTecnicoId] : []))];
    if (conteudoIds.length) {
      const conteudos = await prisma.conteudoTecnico.findMany({ where: { id: { in: conteudoIds }, OR: [{ unidadeId: null }, { unidadeId: modulo.curriculo.unidadeId }] }, select: { id: true } });
      if (conteudos.length !== conteudoIds.length) throw new AppError("Um conteúdo selecionado não está disponível para esta unidade.");
    }

    return prisma.aulaCurriculo.create({
      data: {
        titulo: data.titulo,
        objetivo: data.objetivo,
        descricao: data.descricao,
        duracaoMinutos: data.duracaoMinutos,
        jogosSugeridos: data.jogosSugeridos,
        ordem: data.ordem ?? 0,
        moduloId: data.moduloId,
        blocos: data.blocos?.length ? { create: data.blocos } : undefined,
      },
      include: { blocos: { orderBy: { ordem: "asc" } }, tecnicas: { orderBy: { ordem: "asc" } } },
    });
  }
}
