import type { Evento, StatusEvento, TipoEvento } from "../types";
import type { EventoFormData } from "../schema/evento.schema";

// MOCK TEMPORÁRIO — não existe backend de Eventos/Campanhas ainda. A lista
// abaixo vive em memória (reiniciada a cada reload da página) só pra a
// listagem, o dashboard e as telas de novo/editar terem o que exibir.
//
// Quando o backend existir (sugestão: módulo `eventos` com
// `GET/POST/PUT/DELETE /eventos`, mesmo formato de `Evento`), troque cada
// método abaixo por uma chamada equivalente do `ApiClient` — as páginas já
// consomem só esse contrato de tipos, nenhuma tela precisa mudar.
let proximoId = 4;

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

const EVENTOS_MOCK: Evento[] = [
  {
    id: "1",
    titulo: "Campanha Matrícula de Volta às Aulas",
    descricao: "Desconto na matrícula pra quem se inscrever até o fim do mês.",
    tipo: "CAMPANHA_MATRICULA",
    status: "EM_ANDAMENTO",
    dataInicio: daquiA(-5),
    dataFim: daquiA(10),
    local: "Todas as unidades",
    metaParticipantes: 30,
    participantesConfirmados: 18,
    investimento: 800,
    receitaGerada: 3200,
    responsavel: "Coordenação",
  },
  {
    id: "2",
    titulo: "Seminário com Professor Convidado",
    descricao: "Seminário de finalizações com faixa-preta convidado.",
    tipo: "SEMINARIO",
    status: "AGENDADO",
    dataInicio: daquiA(12),
    local: "Unidade Centro",
    metaParticipantes: 40,
    participantesConfirmados: 22,
    responsavel: "Professor Marcos",
  },
  {
    id: "3",
    titulo: "Aulão de Encerramento do Semestre",
    tipo: "AULAO",
    status: "CONCLUIDO",
    dataInicio: daquiA(-20),
    local: "Unidade Centro",
    metaParticipantes: 60,
    participantesConfirmados: 65,
  },
];

function numeroOuUndefined(valor?: string): number | undefined {
  return valor === undefined || valor === "" ? undefined : Number(valor);
}

function paraEvento(data: EventoFormData): Omit<Evento, "id"> {
  return {
    ...data,
    metaParticipantes: numeroOuUndefined(data.metaParticipantes),
    participantesConfirmados: numeroOuUndefined(data.participantesConfirmados),
    investimento: numeroOuUndefined(data.investimento),
    receitaGerada: numeroOuUndefined(data.receitaGerada),
  };
}

export interface FiltrosEvento {
  busca?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
  dataInicial?: string;
  dataFinal?: string;
}

export class EventoService {
  static async listar(filtros: FiltrosEvento = {}): Promise<Evento[]> {
    return Promise.resolve(
      EVENTOS_MOCK.filter((evento) => {
        if (filtros.busca && !evento.titulo.toLowerCase().includes(filtros.busca.toLowerCase())) {
          return false;
        }
        if (filtros.tipo && evento.tipo !== filtros.tipo) return false;
        if (filtros.status && evento.status !== filtros.status) return false;
        if (filtros.dataInicial && evento.dataInicio < filtros.dataInicial) return false;
        if (filtros.dataFinal && evento.dataInicio > filtros.dataFinal) return false;
        return true;
      })
    );
  }

  static async listarDashboard(): Promise<Evento[]> {
    return this.listar();
  }

  static async buscar(id: string): Promise<Evento | undefined> {
    return Promise.resolve(EVENTOS_MOCK.find((evento) => evento.id === id));
  }

  static async criar(data: EventoFormData): Promise<Evento> {
    const evento: Evento = { ...paraEvento(data), id: String(proximoId++) };
    EVENTOS_MOCK.unshift(evento);
    return Promise.resolve(evento);
  }

  static async atualizar(id: string, data: EventoFormData): Promise<Evento> {
    const indice = EVENTOS_MOCK.findIndex((evento) => evento.id === id);
    if (indice === -1) throw new Error("Evento não encontrado.");

    const atualizado: Evento = { ...paraEvento(data), id };
    EVENTOS_MOCK[indice] = atualizado;
    return Promise.resolve(atualizado);
  }

  static async excluir(id: string): Promise<void> {
    const indice = EVENTOS_MOCK.findIndex((evento) => evento.id === id);
    if (indice !== -1) EVENTOS_MOCK.splice(indice, 1);
    return Promise.resolve();
  }
}
