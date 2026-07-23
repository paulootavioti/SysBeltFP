import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

const MAXIMO_AULAS_POR_REPLICACAO = 400;

interface ReplicarProgramacaoDTO {
  turmaId: number;
  aulaCurriculoId?: number | null;
  dataInicio: string;
  dataFim: string;
  diasSemana: number[];
  observacoes?: string | null;
}

export class ReplicarProgramacaoService {
  async execute(dto: ReplicarProgramacaoDTO) {
    const turma = await prisma.turma.findUnique({ where: { id: dto.turmaId } });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    const [horas, minutos] = turma.horarioInicio.split(":").map(Number);

    const inicio = new Date(dto.dataInicio);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(dto.dataFim);
    fim.setHours(23, 59, 59, 999);

    if (fim < inicio) {
      throw new AppError("A data final deve ser depois da data inicial.");
    }

    const diasSelecionados = new Set(dto.diasSemana);
    const datas: Date[] = [];

    for (const cursor = new Date(inicio); cursor <= fim; cursor.setDate(cursor.getDate() + 1)) {
      if (diasSelecionados.has(cursor.getDay())) {
        const dataAula = new Date(cursor);
        dataAula.setHours(horas || 0, minutos || 0, 0, 0);
        datas.push(dataAula);
      }
    }

    if (datas.length === 0) {
      throw new AppError(
        "Nenhuma data corresponde aos dias da semana selecionados dentro do período informado."
      );
    }

    if (datas.length > MAXIMO_AULAS_POR_REPLICACAO) {
      throw new AppError(
        `O período selecionado geraria ${datas.length} aulas. Reduza o intervalo (máximo de ${MAXIMO_AULAS_POR_REPLICACAO} por replicação).`
      );
    }

    const existentes = await prisma.aulaProgramada.findMany({
      where: { turmaId: dto.turmaId, data: { in: datas } },
      select: { data: true },
    });

    const chavesExistentes = new Set(existentes.map((item) => item.data.getTime()));
    const novasDatas = datas.filter((data) => !chavesExistentes.has(data.getTime()));

    if (novasDatas.length === 0) {
      throw new AppError("Todas as datas do período já possuem programação para esta turma.");
    }

    await prisma.aulaProgramada.createMany({
      data: novasDatas.map((data) => ({
        turmaId: dto.turmaId,
        aulaCurriculoId: dto.aulaCurriculoId ?? undefined,
        data,
        observacoes: dto.observacoes ?? undefined,
      })),
    });

    return {
      criadas: novasDatas.length,
      ignoradasPorDuplicidade: datas.length - novasDatas.length,
    };
  }
}
