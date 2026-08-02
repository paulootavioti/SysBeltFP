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

export interface Frequencia {
  id: number;
  data: string;
  turmaNome: string | null;
  presente: boolean;
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
