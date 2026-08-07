import { ApiClient } from "../../../shared/api/ApiClient";
import type { Modalidade } from "../types/modalidade";
import type { ModalidadeFormData } from "../schema/modalidade.schema";

function corpo(data: ModalidadeFormData) {
  return {
    nome: data.nome,
    descricao: data.descricao || null,
    publicoAlvo: data.publicoAlvo || null,
    coordenadorId: data.coordenadorId ? Number(data.coordenadorId) : null,
    visivelNaLanding: data.visivelNaLanding ?? false,
    ordem: data.ordem ? Number(data.ordem) : 0,
  };
}

export class ModalidadeService {
  static async listar(apenasAtivas = false) {
    return ApiClient.get<Modalidade[]>(
      apenasAtivas ? "/modalidades?ativas=true" : "/modalidades"
    );
  }

  static async criar(data: ModalidadeFormData) {
    return ApiClient.post<Modalidade>("/modalidades", {
      ...corpo(data),
      unidadeId: data.unidadeId ? Number(data.unidadeId) : undefined,
    });
  }

  static async editar(id: number, data: ModalidadeFormData) {
    // modalidade pertence a uma unidade fixa — editar não muda isso.
    return ApiClient.put<Modalidade>(`/modalidades/${id}`, corpo(data));
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Modalidade>(`/modalidades/${id}/ativo`);
  }
}
