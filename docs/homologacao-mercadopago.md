# Homologação do Mercado Pago (mensalidades e pedidos)

Escopo: o pagamento que **o aluno faz à academia** (PIX de mensalidade e
pedido da loja), pelo Tenant Plane. A cobrança que **a academia paga ao
SysBelt** (SaaS) é do Control Plane, em repositório próprio, e tem
homologação separada.

## O que já está provado por teste automatizado

`src/modules/pagamentos/WebhookMercadoPagoRota.test.ts` exercita a rota real
`POST /pagamentos/webhook/mercado_pago/:formaPagamentoId`, com assinatura
`x-signature` de verdade, credenciais cifradas por academia e a API do
Mercado Pago simulada com respostas no formato real
(`src/modules/pagamentos/gateways/mercadoPago/fixtures/`):

| Cenário | Esperado |
|---|---|
| Sem `x-signature`, ou assinada com o segredo de outra academia | 401, nada gravado |
| `approved` | Mensalidade `PAGA`, valor pago gravado, auditoria `webhook:MERCADO_PAGO` |
| `pending`, `in_process`, `rejected`, `cancelled`, `refunded` | 200, mensalidade continua `ABERTA` |
| Mesmo evento reenviado | 200 `JA_PROCESSADO`, sem segunda baixa |
| Três entregas simultâneas do mesmo evento | Só uma aplica |
| Pagamento na conta da academia A com referência a mensalidade da academia B | 200 `IGNORADO`, B intacta |
| Pagamento recorrente (`operation_type: recurring_payment`) | 200 `IGNORADO`, nenhuma mensalidade baixada |

O que falta, e só dá para provar com o Mercado Pago de verdade: que as
credenciais de teste, a URL e o segredo configurados batem com o que o
painel do Mercado Pago envia.

## Preparação

1. No [painel de desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app),
   crie uma aplicação de teste e **usuários de teste** (um vendedor, um
   comprador). Use as credenciais **de teste** do vendedor.
2. Rode a API **localmente**, com banco local, e exponha a porta com um túnel
   HTTPS (`cloudflared tunnel --url http://localhost:3333` ou `ngrok http 3333`).
   Não use o banco de produção para homologar.
3. No SysBelt local, em uma unidade de teste, cadastre a forma de pagamento
   PIX com gateway Mercado Pago, o *Access Token* de teste e o segredo do
   webhook (passo 5). Anote o id da forma de pagamento.
4. No painel do Mercado Pago → **Webhooks**, configure a URL:

   ```text
   https://<seu-tunel>/pagamentos/webhook/mercado_pago/<formaPagamentoId>
   ```

   Em produção, a URL de cada academia é
   `https://sysbeltfp.netlify.app/api/pagamentos/webhook/mercado_pago/<formaPagamentoId>`.
   Marque o evento **Pagamentos**.
5. Copie a **assinatura secreta** gerada pelo painel para o campo de segredo
   do webhook da forma de pagamento.

## Roteiro

Para cada cenário, gere a cobrança pelo **Portal da Família** (aluno com
e-mail cadastrado) e acompanhe três lugares: a tela **Conciliação de
pagamentos**, a mensalidade do aluno e a tabela `EventoWebhookPagamento`
(coluna `resultado`).

| # | Cenário | Como provocar | Esperado |
|---|---|---|---|
| 1 | Notificação chega e é autenticada | Pelo painel, use **Simular notificação** | Log sem `webhook_mercadopago_recusado`; resposta 200 |
| 2 | Segredo errado | Troque um caractere do segredo na forma de pagamento e simule de novo | 401 e `webhook_mercadopago_recusado` no log; desfaça a troca |
| 3 | Pagamento aprovado | Pague o PIX gerado com o comprador de teste (veja na documentação do Mercado Pago como aprovar um PIX em modo teste) | Mensalidade `PAGA`; cobrança conciliada |
| 4 | Pagamento pendente | Gere o PIX e não pague | Mensalidade continua em aberto |
| 5 | Expiração/cancelamento | Deixe o PIX expirar | Resultado `IGNORADO`; mensalidade em aberto; o aluno consegue gerar outro PIX |
| 6 | Reenvio | No painel, reenvie a notificação do pagamento aprovado | `JA_PROCESSADO`; nenhuma baixa nova na auditoria |
| 7 | Estorno | Estorne o pagamento aprovado pelo painel | Resultado `IGNORADO`; o estorno no SysBelt continua manual (ver abaixo) |

Registre data, quem executou e o resultado de cada linha. O gate fica
cumprido com as 7 linhas conforme o esperado.

## Limites conhecidos

- **Estorno e chargeback não reabrem a mensalidade sozinhos.** O webhook
  ignora `refunded`/`charged_back` de propósito: dinheiro saindo pede
  conferência humana. A recepção registra o estorno pela tela da mensalidade.
- **Pagamentos recorrentes (assinatura) não dão baixa automática.** Até
  esta versão, a referência enviada ao Mercado Pago era o id da assinatura,
  que o webhook lia como id de mensalidade. Agora o pagamento recorrente é
  ignorado e as assinaturas novas usam a referência `assinatura:<id>`. A
  baixa automática de mensalidade por assinatura é uma funcionalidade a
  construir.
- **URL sem `formaPagamentoId`** (`/pagamentos/webhook/mercado_pago`) usa as
  credenciais das variáveis de ambiente e não tem trava por conta: é a
  instalação legada de uma academia só. Com mais de um assinante, cada
  academia deve usar a URL com o id da própria forma de pagamento.
