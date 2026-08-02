import { ApiClient } from "../../../shared/api/ApiClient";
import type { LojaKpis, Produto } from "../types";
import type { ProdutoFormData, VarianteFormData } from "../schema/produto.schema";

export interface FiltrosProdutos {
  busca?: string;
  categoria?: string;
  ativo?: string;
}

interface ProdutoPayload extends ProdutoFormData {
  variantes: VarianteFormData[];
}

export class LojaService {
  static async listarProdutos(filtros: FiltrosProdutos = {}) {
    const params = new URLSearchParams();
    if (filtros.busca) params.set("busca", filtros.busca);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.ativo) params.set("ativo", filtros.ativo);

    const query = params.toString();
    return ApiClient.get<Produto[]>(`/loja/produtos${query ? `?${query}` : ""}`);
  }

  static async kpis() {
    return ApiClient.get<LojaKpis>("/loja/kpis");
  }

  static async criar(data: ProdutoPayload) {
    return ApiClient.post<Produto>("/loja/produtos", { ...data, preco: Number(data.preco) });
  }

  static async editar(id: number, data: ProdutoPayload) {
    return ApiClient.put<Produto>(`/loja/produtos/${id}`, { ...data, preco: Number(data.preco) });
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Produto>(`/loja/produtos/${id}/ativo`);
  }
}
