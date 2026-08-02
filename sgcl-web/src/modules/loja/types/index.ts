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
