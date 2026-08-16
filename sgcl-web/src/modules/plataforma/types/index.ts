export type StatusAssinaturaPlataforma =
  | "TESTE"
  | "ATIVA"
  | "INADIMPLENTE"
  | "SUSPENSA"
  | "CANCELADA";

export const STATUS_ASSINATURA_LABEL: Record<StatusAssinaturaPlataforma, string> = {
  TESTE: "Período de teste",
  ATIVA: "Ativa",
  INADIMPLENTE: "Pagamento em atraso",
  SUSPENSA: "Suspensa",
  CANCELADA: "Cancelada",
};

export type StatusFaturaPlataforma = "ABERTA" | "PAGA" | "CANCELADA";

export const STATUS_FATURA_LABEL: Record<StatusFaturaPlataforma, string> = {
  ABERTA: "Em aberto",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

export type RecursoPlataforma = "WHATSAPP" | "GATEWAY_AUTOMATICO" | "CONTROLE_ACESSO";

export const RECURSO_LABEL: Record<RecursoPlataforma, string> = {
  WHATSAPP: "Mensagens por WhatsApp",
  GATEWAY_AUTOMATICO: "Cobrança automática (PIX e cartão)",
  CONTROLE_ACESSO: "Catraca e leitor facial",
};

export interface PrecoUnidadePlataforma {
  unidadeId: number;
  nomeUnidade: string;
  alunosContados: number;
  blocos: number;
  valorCentavos: number;
}

export interface FaturaPlataforma {
  id: number;
  competencia: string;
  vencimento: string;
  alunosContados: number;
  alunosPorBloco: number;
  blocos: number;
  precoPorBlocoCentavos: number;
  valorCentavos: number;
  detalhamentoUnidades: PrecoUnidadePlataforma[] | null;
  status: StatusFaturaPlataforma;
  pagaEm: string | null;
}

export interface MinhaAssinatura {
  conta: { id: number; nome: string; emailCobranca: string | null };
  status: StatusAssinaturaPlataforma;
  diaVencimento: number;
  inicioEm: string;
  fimTesteEm: string | null;
  plano: {
    id: number;
    nome: string;
    descricao: string | null;
    alunosPorBloco: number;
    precoPorBlocoCentavos: number;
    recursos: string[];
  };
  previaDoMes: {
    competencia: string;
    vencimento: string;
    alunosContados: number;
    alunosPorBloco: number;
    blocos: number;
    precoPorBlocoCentavos: number;
    valorCentavos: number;
    unidades: PrecoUnidadePlataforma[];
  };
  faturas: FaturaPlataforma[];
}

// Dinheiro da plataforma trafega em CENTAVOS inteiros (ver
// src/shared/security e o módulo plataforma no backend) — dividir por 100
// só na hora de exibir evita acumular erro de ponto flutuante na conta.
export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
