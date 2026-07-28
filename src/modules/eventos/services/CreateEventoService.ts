import { prisma } from "../../../shared/database/prisma";
import type { StatusEvento, TipoEvento } from "../constants";

interface CreateEventoDTO {
  unidadeId: number;
  titulo: string;
  descricao?: string | null;
  tipo: TipoEvento;
  status: StatusEvento;
  dataInicio: string;
  dataFim?: string | null;
  local?: string | null;
  metaParticipantes?: number;
  participantesConfirmados?: number;
  investimento?: number;
  receitaGerada?: number;
  responsavel?: string | null;
}

export class CreateEventoService {
  async execute(data: CreateEventoDTO) {
    return prisma.evento.create({
      data: {
        ...data,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
      },
    });
  }
}
