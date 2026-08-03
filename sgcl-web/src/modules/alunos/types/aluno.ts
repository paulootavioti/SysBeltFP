import type { Responsavel } from "../../responsaveis/types/responsavel";
import type { Mensalidade } from "../../mensalidades/types/mensalidade";

export interface TurmaResumo {
  id: number;
  nome: string;
}

export interface PlanoResumo {
  id: number;
  nome: string;
  valor: number;
  periodicidade: string;
}

export interface Aluno {
  id: number;

  nome: string;
  apelido?: string | null;
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
  autorizaUsoImagem: boolean;

  turmaId?: number | null;
  turma?: {
    id: number;
    nome: string;
  } | null;

  formaPagamento?: string | null;
  diaVencimento?: number | null;
  planoId?: number | null;
  plano?: PlanoResumo | null;

  createdAt?: string;
  updatedAt?: string;

  responsaveis?: Responsavel[];
  mensalidades?: Mensalidade[];

  // só vem preenchido na resposta de criação/edição, quando o backend
  // acabou de gerar (ou regerar) a senha do Portal da Família — é a
  // única vez que a senha em texto puro aparece em algum lugar.
  senhaPortalGerada?: string | null;
}

// PROFESSOR só recebe do backend esse recorte: nome, apelido, nome do
// responsável e turma — nada de CPF, endereço, saúde ou financeiro.
export interface ResponsavelBasico {
  id: number;
  nome: string;
}

export interface AlunoBasico {
  id: number;
  nome: string;
  apelido?: string | null;
  turma?: TurmaResumo | null;
  responsaveis?: ResponsavelBasico[];
}