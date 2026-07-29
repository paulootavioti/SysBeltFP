// Nomes iguais ao enum StatusMensalidade do backend. "VENCIDA" existe no
// enum mas hoje nunca é gravado pelo backend — ele fica sempre "ABERTA"
// mesmo depois do vencimento; "vencida" continua sendo calculado no
// cliente (ver utils/status.ts), comparando vencimento com hoje.
export type StatusMensalidadeBackend = "ABERTA" | "PAGA" | "VENCIDA" | "CANCELADA" | "ESTORNADA";

export interface Mensalidade {
  id: number;
  alunoId: number;
  valor: number;
  vencimento: string;
  dataPagamento?: string | null;
  pago: boolean;
  descricao?: string | null;

  status: StatusMensalidadeBackend;
  formaPagamentoId?: number | null;
  valorOriginal: number;
  desconto: number;
  acrescimo: number;
  multa: number;
  juros: number;
  valorFinal: number;
  comprovanteUrl?: string | null;
  canceladoEm?: string | null;
  motivoCancelamento?: string | null;
  estornadoEm?: string | null;
  motivoEstorno?: string | null;

  // preenchido só quando a mensalidade foi gerada automaticamente por uma
  // assinatura (cobrança recorrente) — nulo pra mensalidades avulsas.
  assinaturaId?: number | null;

  // Relacionamentos
  aluno?: {
    id: number;
    nome: string;
    faixa?: string;
  };
  formaPagamento?: {
    id: number;
    tipo: string;
    nomePersonalizado?: string | null;
  } | null;
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
  CANCELADA = "CANCELADA",
  ESTORNADA = "ESTORNADA",
}
