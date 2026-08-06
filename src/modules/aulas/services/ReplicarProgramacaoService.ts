import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { buscarConflitoProgramacao, mensagemConflitoProgramacao } from "../../../shared/utils/conflitoHorario";
import {
  comHorarioUTC,
  diaDaSemanaUTC,
  fimDoDiaUTC,
  inicioDoDiaUTC,
  somarDiasUTC,
} from "../../../shared/utils/dataCalendario";

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
  async execute(dto: ReplicarProgramacaoDTO, unidadeId: number | null) {
    const turma = await prisma.turma.findUnique({ where: { id: dto.turmaId } });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    const [horas, minutos] = turma.horarioInicio.split(":").map(Number);

    // Datas de calendário são ancoradas em UTC no sistema inteiro (ver
    // shared/utils/dataCalendario). Usar setHours/getDay aqui lia o dia no
    // fuso do processo: rodando em Brasília, o período 01→31/ago virava
    // 31/jul→30/ago e a última segunda-feira do mês não era criada.
    const inicio = inicioDoDiaUTC(new Date(dto.dataInicio));
    const fim = fimDoDiaUTC(new Date(dto.dataFim));

    if (fim < inicio) {
      throw new AppError("A data final deve ser depois da data inicial.");
    }

    const diasSelecionados = new Set(dto.diasSemana);
    const datas: Date[] = [];

    for (let cursor = inicio; cursor <= fim; cursor = somarDiasUTC(cursor, 1)) {
      if (diasSelecionados.has(diaDaSemanaUTC(cursor))) {
        datas.push(comHorarioUTC(cursor, horas || 0, minutos || 0));
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

    const conflito = await buscarConflitoProgramacao({
      unidadeId: turma.unidadeId,
      turmaId: turma.id,
      arenaId: turma.arenaId,
      professorId: turma.professorId,
      horarioInicio: turma.horarioInicio,
      horarioFim: turma.horarioFim,
      datas: novasDatas,
    });

    if (conflito) {
      throw new AppError(mensagemConflitoProgramacao(conflito));
    }

    await prisma.aulaProgramada.createMany({
      data: novasDatas.map((data) => ({
        unidadeId: turma.unidadeId,
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
