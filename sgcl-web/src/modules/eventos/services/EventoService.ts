import { ApiClient } from "../../../shared/api/ApiClient";
import type { Evento, StatusEvento, TipoEvento } from "../types";
import type { EventoFormData } from "../schema/evento.schema";

export interface FiltrosEvento {
  busca?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
  dataInicial?: string;
  dataFinal?: string;
}

function montarQuery(filtros: FiltrosEvento): string {
  const params = new URLSearchParams();
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.tipo) params.set("tipo", filtros.tipo);
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.dataInicial) params.set("dataInicial", filtros.dataInicial);
  if (filtros.dataFinal) params.set("dataFinal", filtros.dataFinal);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export class EventoService {
  static async listar(filtros: FiltrosEvento = {}) {
    return ApiClient.get<Evento[]>(`/eventos${montarQuery(filtros)}`);
  }

  static async listarDashboard() {
    return ApiClient.get<Evento[]>("/eventos/dashboard");
  }

  static async buscar(id: string) {
    return ApiClient.get<Evento>(`/eventos/${id}`);
  }

  static async criar(data: EventoFormData) {
    return ApiClient.post<Evento>("/eventos", data);
  }

  static async atualizar(id: string, data: EventoFormData) {
    return ApiClient.put<Evento>(`/eventos/${id}`, data);
  }

  static async excluir(id: string) {
    return ApiClient.delete(`/eventos/${id}`);
  }
}
