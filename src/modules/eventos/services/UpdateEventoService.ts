import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import type { StatusEvento, TipoEvento } from "../constants";

interface UpdateEventoDTO {
  id: number;
  unidadeIdUsuario: number | null;
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

export class UpdateEventoService {
  async execute({ id, unidadeIdUsuario, ...data }: UpdateEventoDTO) {
    const evento = await prisma.evento.findUnique({ where: { id } });

    if (!evento) {
      throw new AppError("Evento não encontrado.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, evento.unidadeId, "Evento não encontrado.");

    return prisma.evento.update({
      where: { id },
      data: {
        ...data,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
      },
    });
  }
}
