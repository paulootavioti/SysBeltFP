export interface Resumo {
  aluno: {
    id: number;
    nome: string;
    apelido: string | null;
    faixa: string;
    grau: number;
    fotoUrl: string | null;
  };
  progresso: {
    aulasNoCicloAtual: number;
    aulasPorGrau: number;
    totalPresencas: number;
  };
  mensalidade: {
    id: number;
    valor: number;
    vencimento: string;
    status: string;
  } | null;
  proximaAula: {
    data: string;
    turmaNome: string;
    horarioInicio: string;
    horarioFim: string;
  } | null;
}

export interface FotoTreinoFrequencia {
  id: number;
  url: string;
  legenda: string;
}

export interface Frequencia {
  id: number;
  data: string;
  turmaNome: string | null;
  presente: boolean;
  fotos: FotoTreinoFrequencia[];
}

export interface Mensalidade {
  id: number;
  descricao: string | null;
  valor: number;
  vencimento: string;
  dataPagamento: string | null;
  status: "ABERTA" | "PAGA" | "VENCIDA" | "CANCELADA" | "ESTORNADA";
}

export interface ResultadoPagamento {
  gateway: string;
  gatewayId: string;
  status: string;
  linkPagamento?: string;
}

export interface Agenda {
  tipo: "AULA" | "EVENTO";
  data: string;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
}

export interface Mensagem {
  id: number;
  alunoId: number;
  remetenteTipo: "FAMILIA" | "ACADEMIA";
  remetenteNome: string;
  texto: string;
  createdAt: string;
}

export interface NaoLidasPorAluno {
  alunoId: number;
  naoLidas: number;
}

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
  tamanho: string;
  cor?: string | null;
  estoque: number;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao?: string | null;
  imagemUrl?: string | null;
  variantes: ProdutoVariante[];
  unidade: { id: number; nome: string };
}

export interface ItemCarrinho {
  varianteId: number;
  quantidade: number;
}

export interface ItemPedido {
  id: number;
  varianteId: number;
  quantidade: number;
  precoUnitario: number;
  variante: ProdutoVariante & { produto: Pick<Produto, "id" | "nome" | "categoria" | "imagemUrl"> };
}

export interface Pedido {
  id: number;
  total: number;
  status: "AGUARDANDO_RETIRADA" | "ENTREGUE" | "CANCELADO";
  criadoEm: string;
  entregueEm?: string | null;
  itens: ItemPedido[];
}
