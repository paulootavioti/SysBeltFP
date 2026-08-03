import { ApiClient } from "../../../shared/api/ApiClient";
import type { LojaKpis, Pedido, Produto, StatusPedido } from "../types";
import type { ProdutoFormData, VarianteFormData } from "../schema/produto.schema";

export interface FiltrosProdutos {
  busca?: string;
  categoria?: string;
  ativo?: string;
}

export interface FiltrosPedidos {
  status?: StatusPedido;
  busca?: string;
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

  static async listarPedidos(filtros: FiltrosPedidos = {}) {
    const params = new URLSearchParams();
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.busca) params.set("busca", filtros.busca);

    const query = params.toString();
    return ApiClient.get<Pedido[]>(`/loja/pedidos${query ? `?${query}` : ""}`);
  }

  static async marcarPedidoEntregue(id: number) {
    return ApiClient.patch<Pedido>(`/loja/pedidos/${id}/entregar`);
  }

  static async cancelarPedido(id: number) {
    return ApiClient.patch<Pedido>(`/loja/pedidos/${id}/cancelar`);
  }
}
