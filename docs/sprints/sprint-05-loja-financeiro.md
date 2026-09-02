# Sprint 05 - Loja integrada ao Financeiro

## Objetivo

Transformar o checkout da Loja em um fluxo financeiro rastreavel, sem chamar
um pedido de pago antes da confirmacao e sem perder a reserva de estoque.

## Fluxo implementado

1. A familia monta um carrinho com produtos de uma unica unidade.
2. O pedido nasce como `AGUARDANDO_PAGAMENTO`.
3. O estoque e reservado atomicamente e a movimentacao identifica o pedido.
4. Uma `CobrancaPagamento` e criada antes da chamada ao gateway.
5. Confirmacao manual, webhook ou conciliacao libera o pedido para retirada.
6. Somente `AGUARDANDO_RETIRADA` pode ser marcado como entregue.
7. Cancelamento restaura o estoque e registra a data da operacao.

## Entregas

- forma de pagamento vinculada ao pedido;
- cobranca financeira com tentativas, idempotencia, gateway e erro;
- origem exclusiva da cobranca: mensalidade ou pedido;
- referencia externa `pedido:<id>` para correlacao segura no webhook;
- retentativa reutiliza o pedido existente e nao reserva estoque novamente;
- conciliacao financeira lista pedidos e mensalidades na mesma trilha;
- confirmacao manual separada da entrega no painel da equipe;
- PIX com QR Code, copia e cola e link no Portal da Familia;
- status de pagamento visivel nos dois aplicativos;
- auditoria de confirmacao por webhook, conciliacao ou operacao manual.

## Rotas

- `POST /portal-familia/loja/pedidos`: cria pedido, reserva estoque e inicia a cobranca;
- `POST /portal-familia/loja/pedidos/:id/pagar`: cria nova tentativa no mesmo pedido;
- `PATCH /loja/pedidos/:id/confirmar-pagamento`: confirmacao manual pela equipe;
- `PATCH /loja/pedidos/:id/entregar`: entrega somente depois do pagamento;
- `PATCH /loja/pedidos/:id/cancelar`: cancela e devolve o estoque;
- `GET /pagamentos/conciliacao`: inclui cobrancas de mensalidades e pedidos.

## Operacao local

Sem gateway configurado, a cobranca fica em confirmacao manual:

1. a familia conclui a compra no Portal da Familia;
2. a equipe abre **Loja > Pedidos**;
3. usa **Confirmar pagamento**;
4. depois da retirada, usa **Marcar como entregue**.

Com Mercado Pago configurado na forma de pagamento, o portal apresenta os
dados do PIX e o webhook libera o pedido automaticamente.

## Verificacao

- API: 154 arquivos e 724 testes aprovados;
- painel da equipe: 14 arquivos e 92 testes aprovados;
- Portal da Familia: 5 arquivos e 42 testes aprovados;
- builds de producao dos dois frontends aprovados;
- typecheck da API aprovado;
- migrations aplicadas em `sysbelt` e `sysbelt_test`.
