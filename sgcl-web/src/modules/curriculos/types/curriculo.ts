export interface TecnicaCurriculo {
  id: number;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  obrigatoria: boolean;
  ordem: number;
  duracaoPrevistaSegundos: number;
}

export type TipoBlocoCurriculo = "AQUECIMENTO" | "JOGO" | "SPARRING" | "PAUSA" | "ALONGAMENTO";

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
  modalidade?: { id: number; nome: string } | null;
  publico: string;
  modulos: ModuloCurriculo[];
}
