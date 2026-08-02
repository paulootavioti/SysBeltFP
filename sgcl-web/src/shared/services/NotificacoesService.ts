import { ApiClient } from "../api/ApiClient";

export interface ContadoresMenu {
  mensalidadesVencidas: number;
  contratosAguardandoAssinatura: number;
  graduacoesPendentes: number;
  mensagensFamiliaNaoLidas: number;
}

export class NotificacoesService {
  static async contadoresMenu() {
    return ApiClient.get<ContadoresMenu>("/notificacoes/contadores-menu");
  }
}
