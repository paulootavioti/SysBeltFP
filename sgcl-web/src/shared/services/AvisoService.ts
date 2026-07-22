import { ApiClient } from "../api/ApiClient";

export interface Aviso {
  tipo: string;
  referenciaId: number;
  titulo: string;
  descricao: string;
  dataReferencia: string;
}

export interface AvisosResumo {
  total: number;
  avisos: Aviso[];
}

export class AvisoService {
  static async listar() {
    return ApiClient.get<AvisosResumo>("/avisos");
  }

  static async reconhecer(avisos: { tipo: string; referenciaId: number }[]) {
    return ApiClient.post<void>("/avisos/reconhecer", { avisos });
  }
}
