import { ApiClient } from "../../../shared/api/ApiClient";
import type { FotoTreino, PublicarFotosTreinoResultado } from "../types";

export class FotosTreinoService {
  static async listar(aulaId: number) {
    return ApiClient.get<FotoTreino[]>(`/fotos-treino?aulaId=${aulaId}`);
  }

  static async publicar(data: {
    aulaId: number;
    urls: string[];
    legenda: string;
    visivelNaLanding: boolean;
  }) {
    return ApiClient.post<PublicarFotosTreinoResultado>("/fotos-treino", data);
  }

  static async alternarVisibilidade(id: number) {
    return ApiClient.patch<FotoTreino>(`/fotos-treino/${id}/visibilidade`);
  }

  static async excluir(id: number) {
    return ApiClient.delete<void>(`/fotos-treino/${id}`);
  }
}
