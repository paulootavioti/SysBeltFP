export interface TecnicaCurriculo {
  id: number;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  obrigatoria: boolean;
  ordem: number;
  duracaoPrevistaSegundos: number;
}

export type TipoBlocoCurriculo = "AQUECIMENTO" | "JOGO" | "TECNICA" | "SPARRING" | "PAUSA" | "ALONGAMENTO";

export type TipoItemCatalogoPedagogico = "POSICAO" | "EXERCICIO" | "MOMENTO";

export interface ItemCatalogoPedagogico {
  id: number;
  tipo: TipoItemCatalogoPedagogico;
  nome: string;
  tipoBloco: TipoBlocoCurriculo | null;
  descricao: string | null;
  atencoesFaixaEtaria: string | null;
  duracaoPrevistaSegundos: number;
}

export interface ConteudoBiblioteca {
  id: number;
  unidadeId: number | null;
  modalidadeId: number;
  tipo: string;
  nome: string;
  descricao: string | null;
  passoAPasso: string | null;
  pontosAtencao: string | null;
  cuidados?: string | null;
  nivelDificuldade: string;
  duracaoSugeridaSegundos: number;
  modalidade: { id: number; nome: string };
  tags: Array<{ tag: { id: number; nome: string } }>;
}

export interface TemplatePlanejamento {
  id: number;
  unidadeId: number | null;
  nome: string;
  descricao: string | null;
  publico: string | null;
  versao?: number;
  etapas: Array<{ id: number; tipo: TipoBlocoCurriculo; titulo: string; duracaoSegundos: number; descricao: string | null }>;
}

export interface BlocoCurriculo {
  id: number;
  tipo: TipoBlocoCurriculo;
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  rounds?: number | null;
  duracaoRoundSegundos?: number | null;
  descansoSegundos?: number | null;
  anuncio?: string | null;
  descricao?: string | null;
  atencoesFaixaEtaria?: string | null;
  conteudoTecnicoId?: number | null;
}

export interface AulaCurriculo {
  id: number;
  titulo: string;
  objetivo?: string | null;
  descricao?: string | null;
  duracaoMinutos?: number | null;
  jogosSugeridos?: string | null;
  ordem: number;
  tecnicas: TecnicaCurriculo[];
  blocos: BlocoCurriculo[];
  filaCompilada: {
    duracaoTotalSegundos: number;
    blocos: Array<{ chave: string; tipo: string; nome: string; duracaoPrevistaSegundos: number }>;
  };
  duracaoTurmaMinutos: number | null;
}

export interface ModuloCurriculo {
  id: number;
  nome: string;
  descricao?: string | null;
  faixa?: string | null;
  idadeMinima?: number | null;
  idadeMaxima?: number | null;
  ordem: number;
  aulas: AulaCurriculo[];
}

export interface Curriculo {
  id: number;
  nome: string;
  descricao?: string | null;
  modalidadeId: number | null;
  modalidade?: { id: number; nome: string; bibliotecaModalidadeId?: number | null } | null;
  publico: string;
  modulos: ModuloCurriculo[];
}
