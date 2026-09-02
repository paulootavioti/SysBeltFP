# Sprint 02 — Pagamentos e contratos automáticos

## Objetivo

Dar rastreabilidade operacional a cada tentativa de cobrança, permitir
conciliação e retentativa sem duplicidade, ativar cartão recorrente no Mercado
Pago e enviar contratos para assinatura eletrônica no Autentique.

## Entregas

- toda tentativa de pagamento é persistida antes da chamada ao gateway;
- chave de idempotência própria é reutilizada pelo Mercado Pago;
- PIX, erros, identificador externo, status e número da tentativa ficam na trilha;
- aba **Conciliação** no Financeiro, com consulta ao gateway e nova tentativa;
- webhook atualiza tanto a mensalidade quanto a tentativa correspondente;
- autorização de cartão recorrente via `preapproval` do Mercado Pago;
- link de autorização e estado externo visíveis na lista de assinaturas;
- envio do HTML do contrato ao Autentique com e-mail e CPF do contratante;
- conclusão por webhook atualiza contrato, URL assinada e linha do tempo;
- envio idempotente: uma solicitação pendente não é criada novamente.

## Configuração de produção

```env
PORTAL_FAMILIA_URL=https://familia.seu-dominio.com
AUTENTIQUE_API_TOKEN=...
AUTENTIQUE_WEBHOOK_SECRET=...
```

No Autentique, cadastre `POST /assinatura-eletronica/webhook/AUTENTIQUE`, guarde
o segredo retornado em `AUTENTIQUE_WEBHOOK_SECRET` e assine os eventos
`document.finished` e `signature.rejected`. O backend valida o HMAC SHA-256 do
cabeçalho `X-Autentique-Signature` sobre os bytes originais da requisição.

No Mercado Pago, mantenha os eventos `payment`, `subscription_preapproval` e
`subscription_authorized_payment` habilitados. A baixa das mensalidades segue
usando `payment`; a assinatura guarda o `preapproval` para autorização do
pagador e futuras consultas.

## Operação

- `FALHA` e `RECUSADO`: o administrador pode criar uma nova tentativa;
- cobrança com identificador externo: **Conciliar** consulta a fonte oficial;
- mensalidade cancelada ou estornada com pagamento aprovado exige tratamento
  manual e não é reaberta automaticamente;
- contrato em `ENVIANDO` ou `PENDENTE` não é reenviado ao provedor;
- a assinatura manual permanece disponível quando o Autentique não for usado.

## Verificação

- backend: 153 arquivos e 715 testes;
- frontend da equipe: 14 arquivos e 91 testes;
- Portal da Família: 5 arquivos e 42 testes;
- Portal do Professor: 6 arquivos e 49 testes;
- total: 897 testes;
- builds de produção aprovados nos três frontends;
- migration aplicada em `sysbelt` e `sysbelt_test`.
