# Observabilidade

O que é medido, para onde vai e quais alertas configurar. Os dados saem de
três lugares:

| Fonte | O que mostra | Onde fica |
|---|---|---|
| Log JSON das functions (`src/shared/observability/logger.ts`) | Toda requisição (`http_request`: rota, status, duração, unidade) e os eventos de negócio | Netlify → site `sysbeltfp` → Logs → Functions (retenção curta) |
| Sentry | Erros e os avisos selecionados, agrupados e com histórico | Projeto do Sentry, com alertas |
| Monitor de disponibilidade externo | Se a API está de pé e o tempo de resposta | BetterStack, UptimeRobot ou similar |

## Configuração

1. Crie no [Sentry](https://sentry.io) (o plano gratuito atende o piloto) um
   projeto **Node** para a API e um projeto **React** para os frontends.
2. No Netlify:
   - site `sysbeltfp`: `SENTRY_DSN` (projeto Node) e `VITE_SENTRY_DSN` (projeto React, usado pelo `sgcl-web`);
   - sites dos portais: `VITE_SENTRY_DSN` (projeto React).
   `VITE_SENTRY_DSN` entra no build: faça um novo deploy depois de definir.
3. Cadastre no monitor externo, com checagem a cada 1 minuto:
   - `https://sysbeltfp.netlify.app/api/health/ready` (API e banco)
   - `https://sysbeltfp.netlify.app/`, `https://sysbeltportalfamilia.netlify.app/` e
     `https://portalprofessorsysbelt.netlify.app/` (frontends)

Sem as variáveis, nada é enviado ao Sentry e o sistema funciona igual.

## Eventos enviados ao Sentry

Todo `logger.error` vira erro no Sentry. Entre os avisos (`logger.warn`), só
os de `AVISOS_ALERTAVEIS` (em `logger.ts`) viram alerta: o restante é ruído,
como um webhook com assinatura inválida de quem testa a URL.

| Evento | Nível | Quando |
|---|---|---|
| `erro_nao_tratado` | erro | Exceção inesperada em qualquer rota (resposta 500) |
| `erro_servico` | erro | Erro 5xx conhecido, como provedor não configurado |
| `api_sem_banco` | erro | `/health/ready` não alcançou o banco em 3 s |
| `job_falhou` | erro | Função agendada do Netlify terminou com erro |
| `concessao_vencida` | erro | Concessão ativa venceu sem renovação: a academia está em somente leitura e sem os recursos do plano |
| `concessao_vencendo` | aviso | Concessão ativa vence em até 7 dias (verificação diária, 8h de Brasília) |
| `concessao_rejeitada` | aviso | O Control Plane enviou concessão recusada (assinatura, tenant, validade ou revisão) |
| `webhook_pagamento_conta_divergente` | aviso | Webhook de pagamento tentou dar baixa em cobrança de outra academia |
| `requisicao_lenta` | aviso | Requisição acima de 800 ms |
| Erros do navegador | erro | Exceções não tratadas nos três frontends |

Antes do envio, mensagens e exceções passam pelo mesmo filtro do log
(connection strings, tokens Bearer e parâmetros OAuth são mascarados). Dados
da requisição e do usuário não são enviados. No navegador, a query string das
URLs é removida (os links de redefinição de senha carregam o token nela).

## Alertas recomendados

Configure no Sentry (Alerts → Create Alert → Issues), com e-mail ou WhatsApp
para o responsável:

| Alerta | Regra | Por quê |
|---|---|---|
| Erro novo | Qualquer issue nova no projeto Node ou React | Toda falha nova merece ser vista uma vez |
| Pico de 5xx | `evento:erro_nao_tratado` com mais de 10 eventos em 5 minutos | Indisponibilidade parcial |
| Banco fora | `evento:api_sem_banco`, qualquer ocorrência | A API não atende nada sem banco |
| Job falhou | `evento:job_falhou`, qualquer ocorrência | Contagem para o faturamento e verificação de concessões |
| Concessão vencida | `evento:concessao_vencida`, qualquer ocorrência | Academia pagante pode estar travada em somente leitura |
| Concessão vencendo | `evento:concessao_vencendo`, uma vez por dia | Uma semana para resolver a renovação |
| Lentidão | `evento:requisicao_lenta` com mais de 20 eventos em 10 minutos | Aproximação do p95 acima de 800 ms |
| Webhook cruzado | `evento:webhook_pagamento_conta_divergente`, qualquer ocorrência | Tentativa de baixa em outra academia |

No monitor externo: alerta quando `/api/health/ready` falhar 2 checagens
seguidas, ou passar de 2 s de resposta.

## Limites conhecidos

- **Não há p95 exato.** Sem rastreamento de performance (a instrumentação
  automática do Sentry não funciona no bundle da function), a latência é
  vigiada pela contagem de `requisicao_lenta` e pelo tempo de resposta do
  monitor externo. Para medir o p95 de verdade, use o teste de carga
  (`tests/load/smoke.js`).
- **Os crons externos** (`ensureCronSecret`: régua de cobrança, lembrete de
  aula, mensageria) falham como qualquer rota: viram `erro_nao_tratado`. Se
  o serviço de cron parar de chamar, ninguém é avisado. Configure no próprio
  serviço de cron o alerta de falha ou de execução ausente.
- **O log das functions** guarda pouco tempo no Netlify. Para investigar
  depois, o histórico é o do Sentry.
