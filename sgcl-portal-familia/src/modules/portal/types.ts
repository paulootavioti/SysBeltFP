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
    arenaNome: string | null;
    professorNome: string | null;
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
  // PIX: o "copia e cola" e a mesma informação como imagem. Vêm vazios
  // quando a forma de pagamento não tem gateway integrado — nesse caso a
  // confirmação segue sendo manual, pela recepção.
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  expiraEm?: string | null;
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

export interface ConsentimentoFamilia {
  id: number;
  tipo: "TRATAMENTO_DADOS" | "USO_IMAGEM" | "BIOMETRIA" | "DADOS_SAUDE" | "COMUNICACOES";
  concedido: boolean;
  versaoPolitica: string;
  textoAceito: string | null;
  createdAt: string;
  revogadoEm: string | null;
  responsavel: { nome: string } | null;
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
  unidade: {
    id: number;
    nome: string;
    formasPagamento: { id: number; tipo: string; nomePersonalizado?: string | null }[];
  };
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
  status: "AGUARDANDO_PAGAMENTO" | "AGUARDANDO_RETIRADA" | "ENTREGUE" | "CANCELADO";
  criadoEm: string;
  entregueEm?: string | null;
  itens: ItemPedido[];
  pagamento?: {
    cobrancaId: number;
    gateway: string;
    status: string;
    linkPagamento?: string;
    pixCopiaECola?: string;
    pixQrCodeBase64?: string;
    erro?: string;
  };
  cobrancas?: { id: number; status: string; linkPagamento?: string | null; pixCopiaECola?: string | null }[];
}

export type SituacaoContrato =
  | "PENDENTE_ASSINATURA" | "ASSINADO" | "ATIVO" | "SUSPENSO"
  | "CANCELADO" | "ENCERRADO" | "RENOVADO";

export interface ContratoFamilia {
  id: number;
  numero: number;
  valor: number;
  dataInicioVigencia: string;
  dataFimVigencia?: string | null;
  situacao: SituacaoContrato;
  conteudoGerado: string;
  tipoAssinatura?: "DIGITAL" | "ELETRONICA" | "PRESENCIAL" | null;
  assinadoEm?: string | null;
  contratoAssinadoUrl?: string | null;
  createdAt: string;
  modeloContrato: { nome: string; versao: number };
  solicitacoesAssinatura: {
    status: string;
    linkAssinatura?: string | null;
    documentoAssinadoUrl?: string | null;
  }[];
}
