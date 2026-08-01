export interface Responsavel {
  id: number;

  nome: string;

  apelido?: string | null;

  parentesco: string;

  telefone?: string | null;

  whatsapp?: string | null;

  email?: string | null;

  cpf?: string | null;

  rg?: string | null;

  dataNascimento?: string | null;

  sexo?: string |null;

  cep?: string | null;

  logradouro?: string | null;

  numero?: string | null;

  complemento?: string | null;

  bairro?: string | null;

  cidade?: string | null;

  uf?: string | null;

  responsavelFinanceiro: boolean;

  podeBuscar: boolean;

  contatoEmergencia: boolean;

  recebeComunicados: boolean;

  observacoes?: string | null;

  fotoUrl?: string | null;

  ativo: boolean;

  alunoId: number;

  // só vem preenchido na resposta de criação/edição, quando o backend
  // acabou de gerar (ou regerar) a senha do Portal da Família — é a
  // única vez que a senha em texto puro aparece em algum lugar.
  senhaPortalGerada?: string | null;
}