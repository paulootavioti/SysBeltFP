import { api } from "../../../services/api";

import type { ResponsavelFormData } from "../schema/responsavel.schema";
import type { Responsavel } from "../types/responsavel";

export class ResponsavelService {
  static async criar(
    alunoId: number,
    data: ResponsavelFormData
  ) {
    const response = await api.post<Responsavel>("/responsaveis", {
      alunoId,
      ...data,
    });

    return response.data;
  }

  static async atualizar(
    id: number,
    alunoId: number,
    data: ResponsavelFormData
  ) {
    const response = await api.put<Responsavel>(
      `/responsaveis/${id}`,
      {
        alunoId,
        ...data,
      }
    );

    return response.data;
  }

  static async excluir(id: number) {
    await api.delete(`/responsaveis/${id}`);
  }

  static async definirSenhaPortal(id: number, senha: string) {
    await api.patch(`/responsaveis/${id}/senha-portal`, { senha });
  }

  static async listarPorAluno(
    alunoId: number
  ) {
    const response = await api.get(
      `/alunos/${alunoId}/responsaveis`
    );

    return response.data;
  }


}