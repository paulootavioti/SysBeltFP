import { ApiClient } from "../../../shared/api/ApiClient";
import type { Curriculo } from "../types/curriculo";
import type {
  CurriculoFormData,
  ModuloFormData,
  AulaCurriculoFormData,
  TecnicaCurriculoFormData,
} from "../schema/curriculo.schema";

type BlocoCurriculoPayload = {
  tipo: "AQUECIMENTO" | "JOGO" | "SPARRING" | "PAUSA" | "ALONGAMENTO";
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  rounds?: number;
  duracaoRoundSegundos?: number;
  descansoSegundos?: number;
  anuncio?: string;
};

type AulaCurriculoPayload = Omit<AulaCurriculoFormData, "duracaoMinutos" | "blocos"> & {
  duracaoMinutos?: number;
  blocos?: BlocoCurriculoPayload[];
};

// "Sem modalidade" chega como string vazia do <select>; mandar "" faria o
// z.coerce.number() do backend virar 0 e falhar no .positive().
function corpoCurriculo(data: CurriculoFormData) {
  return {
    ...data,
    modalidadeId: data.modalidadeId ? Number(data.modalidadeId) : null,
  };
}

export class CurriculoService {
  static async listar() {
    return ApiClient.get<Curriculo[]>("/curriculos");
  }

  static async criar(data: CurriculoFormData) {
    return ApiClient.post<Curriculo>("/curriculos", corpoCurriculo(data));
  }

  static async criarModulo(data: ModuloFormData & { curriculoId: number }) {
    return ApiClient.post("/curriculos/modulos", data);
  }

  static async criarAula(
    data: AulaCurriculoPayload & { moduloId: number }
  ) {
    return ApiClient.post("/curriculos/aulas", data);
  }

  static async criarTecnica(data: Omit<TecnicaCurriculoFormData, "duracaoPrevistaMinutos"> & { aulaCurriculoId: number; duracaoPrevistaSegundos: number }) {
    return ApiClient.post("/curriculos/tecnicas", data);
  }

  static async atualizar(id: number, data: CurriculoFormData) {
    return ApiClient.put<Curriculo>(`/curriculos/${id}`, corpoCurriculo(data));
  }

  static async atualizarModulo(id: number, data: ModuloFormData) {
    return ApiClient.put(`/curriculos/modulos/${id}`, data);
  }

  static async atualizarAula(
    id: number,
    data: AulaCurriculoPayload
  ) {
    return ApiClient.put(`/curriculos/aulas/${id}`, data);
  }

  static async atualizarTecnica(id: number, data: Omit<TecnicaCurriculoFormData, "duracaoPrevistaMinutos"> & { duracaoPrevistaSegundos: number }) {
    return ApiClient.put(`/curriculos/tecnicas/${id}`, data);
  }

  static async excluir(id: number) {
    return ApiClient.delete(`/curriculos/${id}`);
  }

  static async excluirModulo(id: number) {
    return ApiClient.delete(`/curriculos/modulos/${id}`);
  }

  static async excluirAula(id: number) {
    return ApiClient.delete(`/curriculos/aulas/${id}`);
  }

  static async excluirTecnica(id: number) {
    return ApiClient.delete(`/curriculos/tecnicas/${id}`);
  }
}
