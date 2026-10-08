import { ApiClient } from "../../../shared/api/ApiClient";
import { api } from "../../../services/api";
import type { AulaCurriculo, ConteudoBiblioteca, Curriculo, ItemCatalogoPedagogico, TemplatePlanejamento, TipoBlocoCurriculo, TipoItemCatalogoPedagogico } from "../types/curriculo";
import type {
  CurriculoFormData,
  ModuloFormData,
  AulaCurriculoFormData,
  TecnicaCurriculoFormData,
} from "../schema/curriculo.schema";

type BlocoCurriculoPayload = {
  tipo: TipoBlocoCurriculo;
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  rounds?: number;
  duracaoRoundSegundos?: number;
  descansoSegundos?: number;
  anuncio?: string;
  descricao?: string;
  atencoesFaixaEtaria?: string;
  conteudoTecnicoId?: number;
};

export type ItemCatalogoPedagogicoPayload = {
  tipo: TipoItemCatalogoPedagogico;
  nome: string;
  tipoBloco?: TipoBlocoCurriculo | null;
  descricao?: string;
  atencoesFaixaEtaria?: string;
  duracaoPrevistaSegundos: number;
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
  static async listarConteudosBiblioteca(busca = "") {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : "";
    return ApiClient.get<ConteudoBiblioteca[]>(`/biblioteca-pedagogica/conteudos${query}`);
  }

  static async listarModalidadesBiblioteca() {
    return ApiClient.get<Array<{ id: number; nome: string }>>("/biblioteca-pedagogica/modalidades");
  }

  static async pesquisarConteudosBiblioteca(params: { busca?: string; modalidadeLocalId?: number; cursor?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.modalidadeLocalId) query.set("modalidadeLocalId", String(params.modalidadeLocalId));
    if (params.cursor) query.set("cursor", String(params.cursor));
    query.set("limite", String(params.limite ?? 20));
    return ApiClient.get<{ itens: ConteudoBiblioteca[]; proximoCursor: number | null; modalidadeId: number | null }>(`/biblioteca-pedagogica/conteudos/pesquisa?${query.toString()}`);
  }

  static async listarTemplatesPlanejamento() {
    return ApiClient.get<TemplatePlanejamento[]>("/biblioteca-pedagogica/templates");
  }

  static async copiarConteudoBiblioteca(id: number) {
    return ApiClient.post(`/biblioteca-pedagogica/conteudos/${id}/copiar`, {});
  }
  static async criarConteudoBiblioteca(data: Record<string, unknown>) {
    return ApiClient.post<ConteudoBiblioteca>("/biblioteca-pedagogica/conteudos", data);
  }
  static async excluirConteudoBiblioteca(id: number) {
    return ApiClient.delete(`/biblioteca-pedagogica/conteudos/${id}`);
  }
  static async listarCatalogoPedagogico() {
    return ApiClient.get<ItemCatalogoPedagogico[]>("/curriculos/catalogo-pedagogico");
  }

  static async criarItemCatalogoPedagogico(data: ItemCatalogoPedagogicoPayload) {
    return ApiClient.post<ItemCatalogoPedagogico>("/curriculos/catalogo-pedagogico", data);
  }
  static async listar() {
    return ApiClient.get<Curriculo[]>("/curriculos");
  }

  static async criar(data: CurriculoFormData) {
    return ApiClient.post<Curriculo>("/curriculos", corpoCurriculo(data));
  }

  static async exportar(id: number) {
    const response = await api.get(`/curriculos/${id}/exportar`, { responseType: "blob" });
    return response.data as Blob;
  }

  static async importar(data: unknown) {
    return ApiClient.post<{ curriculo: Curriculo; avisos: string[] }>("/curriculos/importar", data);
  }

  static async exportarMatriz(formato: "csv" | "xls" | "pdf") {
    const response = await api.get(`/curriculos/exportar-matriz-arquivo?formato=${formato}`, { responseType: "blob" });
    return response.data as Blob;
  }

  static async importarMatriz(data: unknown) {
    return ApiClient.post<{ matriz: string; curriculos: Array<{ id: number; nome: string }>; avisos: string[] }>("/curriculos/importar-matriz", data);
  }

  static async importarArquivoMatriz(arquivo: File) {
    const dados = new FormData();
    dados.append("arquivo", arquivo);
    const response = await api.post<{ matriz: string; curriculos: Array<{ id: number; nome: string }>; avisos: string[] }>("/curriculos/importar-matriz-arquivo", dados);
    return response.data;
  }

  static async criarModulo(data: ModuloFormData & { curriculoId: number }) {
    return ApiClient.post("/curriculos/modulos", data);
  }

  static async criarAula(
    data: AulaCurriculoPayload & { moduloId: number }
  ) {
    return ApiClient.post("/curriculos/aulas", data);
  }

  static async criarAulaAssistida(data: { moduloId: number; titulo: string; objetivo?: string; templateId?: number; conteudoIds: number[]; substituirEtapasTecnicas?: boolean }) {
    return ApiClient.post<AulaCurriculo>("/curriculos/aulas/assistida", data);
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

  static async duplicarAula(id: number) {
    return ApiClient.post<AulaCurriculo>(`/curriculos/aulas/${id}/duplicar`, {});
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
