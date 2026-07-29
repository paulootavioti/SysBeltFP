export type TipoFormaPagamento =
  | "PIX"
  | "PIX_RECORRENTE"
  | "CARTAO_CREDITO_VISTA"
  | "CARTAO_CREDITO_PARCELADO"
  | "CARTAO_CREDITO_RECORRENTE"
  | "CARTAO_DEBITO"
  | "TRANSFERENCIA"
  | "DINHEIRO"
  | "BOLETO"
  | "LINK_PAGAMENTO"
  | "OUTRO";

export const TIPO_FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  PIX: "PIX avulso",
  PIX_RECORRENTE: "PIX recorrente (assinatura)",
  CARTAO_CREDITO_VISTA: "Cartão de crédito à vista",
  CARTAO_CREDITO_PARCELADO: "Cartão de crédito parcelado",
  CARTAO_CREDITO_RECORRENTE: "Cartão de crédito recorrente (assinatura)",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência bancária",
  DINHEIRO: "Dinheiro",
  BOLETO: "Boleto bancário",
  LINK_PAGAMENTO: "Link de pagamento",
  OUTRO: "Outra (personalizada)",
};

export interface FormaPagamento {
  id: number;
  unidadeId: number;
  tipo: TipoFormaPagamento;
  nomePersonalizado?: string | null;
  ativo: boolean;
  configuracao?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Rótulo pronto pra exibir em qualquer lugar (selects de forma de
// pagamento em Mensalidade, listagens etc.) — usa o nome personalizado
// quando existir, senão o rótulo padrão do tipo. Aceita `tipo` como string
// solta (não só o union `TipoFormaPagamento`) porque objetos aninhados
// vindos da API (ex.: Mensalidade.formaPagamento) nem sempre carregam o
// tipo estreito — cai no próprio valor bruto se não reconhecer o tipo.
export function nomeFormaPagamento(forma: { tipo: string; nomePersonalizado?: string | null }): string {
  if (forma.tipo === "OUTRO" && forma.nomePersonalizado) return forma.nomePersonalizado;
  return TIPO_FORMA_PAGAMENTO_LABEL[forma.tipo as TipoFormaPagamento] ?? forma.tipo;
}
