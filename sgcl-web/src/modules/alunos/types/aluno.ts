import type { Responsavel } from "../../responsaveis/types/responsavel";

export interface TurmaResumo {
  id: number;
  nome: string;
}

export interface Aluno {
  id: number;

  nome: string;
  dataNascimento: string;

  sexo?: string | null;
  cpf?: string | null;
  rg?: string | null;

  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;

  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;

  escola?: string | null;
  serieEscolar?: string | null;
  turnoEscolar?: string | null;

  peso?: number | null;
  altura?: number | null;

  tamanhoKimono?: string | null;
  marcaKimono?: string | null;

  restricoesMedicas?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  observacoes?: string | null;

  fotoUrl?: string | null;

  faixa: string;
  grau: number;
  ativo: boolean;

  turmaId?: number | null;
  turma?: {
    id: number;
    nome: string;
  } | null;
  
  createdAt?: string;
  updatedAt?: string;

  responsaveis?: Responsavel[];
}