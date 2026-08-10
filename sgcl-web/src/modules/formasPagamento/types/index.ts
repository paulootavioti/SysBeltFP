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

// Gateways com integração pronta. Os demais nomes existem no backend como
// stub e só entram aqui quando a integração de fato for implementada —
// oferecer na tela algo que não cobra seria pior que não oferecer.
export const GATEWAYS_DISPONIVEIS = [{ value: "MERCADO_PAGO", label: "Mercado Pago" }];

export const CREDENCIAIS_DO_GATEWAY: Record<string, { campo: string; label: string; ajuda: string }[]> = {
  MERCADO_PAGO: [
    {
      campo: "accessToken",
      label: "Access token",
      ajuda: "Mercado Pago > Suas integrações > sua aplicação > Credenciais.",
    },
    {
      campo: "webhookSecret",
      label: "Chave secreta do webhook",
      ajuda: "Webhooks > Configurar notificação > revelar chave secreta.",
    },
  ],
};

// O que a API devolve no lugar de `configuracao`: qual gateway está ligado
// e quais credenciais já foram preenchidas — nunca os valores. Ver
// src/modules/pagamentos/gateways/credenciais.ts no backend.
export interface ResumoGateway {
  gateway: string | null;
  credenciaisConfiguradas: Record<string, boolean>;
}

export interface FormaPagamento {
  id: number;
  unidadeId: number;
  tipo: TipoFormaPagamento;
  nomePersonalizado?: string | null;
  ativo: boolean;
  gateway: ResumoGateway;
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
