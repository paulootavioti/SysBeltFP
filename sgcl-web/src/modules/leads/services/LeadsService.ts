import { ApiClient } from "../../../shared/api/ApiClient";
import type { EstagioLead, PaginaLeads } from "../types";

export interface FiltrosLeads {
  estagio?: EstagioLead;
  pagina?: number;
}

export class LeadsService {
  static async listar(filtros: FiltrosLeads = {}) {
    const params = new URLSearchParams();
    if (filtros.estagio) params.set("estagio", filtros.estagio);
    if (filtros.pagina) params.set("pagina", String(filtros.pagina));

    const query = params.toString();
    return ApiClient.get<PaginaLeads>(`/leads${query ? `?${query}` : ""}`);
  }
}
