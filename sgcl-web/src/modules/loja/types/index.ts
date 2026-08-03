export type CategoriaProduto =
  | "KIMONO"
  | "RASHGUARD"
  | "BERMUDA"
  | "FAIXA"
  | "PATCH"
  | "CHAVEIRO"
  | "PULSEIRA"
  | "OUTROS";

export const CATEGORIA_PRODUTO_LABEL: Record<CategoriaProduto, string> = {
  KIMONO: "Kimono",
  RASHGUARD: "Rashguard",
  BERMUDA: "Bermuda",
  FAIXA: "Faixa",
  PATCH: "Patch",
  CHAVEIRO: "Chaveiro",
  PULSEIRA: "Pulseira/Band",
  OUTROS: "Outros",
};

export interface ProdutoVariante {
  id: number;
  produtoId: number;
  tamanho: string;
  cor?: string | null;
  estoque: number;
}

export interface Produto {
  id: number;
  unidadeId: number;
  unidade: { id: number; nome: string };
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao?: string | null;
  ativo: boolean;
  imagemUrl?: string | null;
  variantes: ProdutoVariante[];
  estoqueTotal: number;
  numVariantes: number;
  estoqueBaixo: boolean;
}

export interface LojaKpis {
  produtosAtivos: number;
  unidadesEmEstoque: number;
  produtosComEstoqueBaixo: number;
  valorTotalEstoque: number;
}

export type StatusPedido = "AGUARDANDO_RETIRADA" | "ENTREGUE" | "CANCELADO";

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  AGUARDANDO_RETIRADA: "Aguardando retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export interface ItemPedido {
  id: number;
  varianteId: number;
  quantidade: number;
  precoUnitario: number;
  variante: ProdutoVariante & { produto: Pick<Produto, "id" | "nome" | "categoria"> };
}

export interface Pedido {
  id: number;
  unidadeId: number;
  unidade: { id: number; nome: string };
  aluno: { id: number; nome: string; apelido?: string | null };
  total: number;
  status: StatusPedido;
  itens: ItemPedido[];
  criadoEm: string;
  entregueEm?: string | null;
}
