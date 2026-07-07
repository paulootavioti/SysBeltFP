export interface Mensalidade {
  id: number;
  alunoId: number;
  valor: number;
  vencimento: string;
  dataPagamento?: string | null;
  pago: boolean;
  
  // Relacionamentos
  aluno?: {
    id: number;
    nome: string;
    faixa?: string;
  };
}

export interface MensalidadeComAluno extends Mensalidade {
  aluno: {
    id: number;
    nome: string;
    faixa: string;
  };
}

export enum StatusMensalidade {
  PENDENTE = "PENDENTE",
  VENCIDA = "VENCIDA",
  PAGA = "PAGA",
}
