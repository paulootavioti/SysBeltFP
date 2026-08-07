export interface TecnicaCurriculo {
  id: number;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  obrigatoria: boolean;
  ordem: number;
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