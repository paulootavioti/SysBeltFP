# Prontidão para lançamento comercial

Status: bloqueado até os critérios abaixo serem comprovados em ambiente de produção controlado.

## Decisão arquitetural

O Control Plane permanece isolado, em repositório, banco e autenticação próprios. Ele é a fonte de verdade comercial de assinantes, planos, faturas, cobrança e concessões. O Tenant Plane mantém somente a operação da academia e uma projeção assinada da concessão, validada localmente.

Não é pertinente reintroduzir o domínio comercial no Tenant Plane nem criar banco por academia agora. O banco operacional compartilhado, isolado por `Conta` e `Unidade`, é a decisão vigente (ADR-014). A evolução segura é reforçar testes de fronteira e manter o Control Plane como controlador externo.

## Gates de lançamento

- [ ] Corrigir a publicação independente dos três frontends e comprovar que todos consomem o commit de `main`
  - Comprovação: após o deploy, `npm run deploy:verificar` precisa sair todo ✅ (versão dos quatro sites e CORS dos portais; ver "Verificação pós-deploy" em `docs/deploy.md`)
- [ ] Homologar duas contas reais de teste: leitura, escrita, busca por ID, upload, exportação, jobs e webhooks sem acesso cruzado
- [ ] Definir e aprovar matriz RBAC, incluindo a decisão sobre os papéis Gerente e Usuário comum
- [ ] Homologar o gateway de cobrança SaaS em sandbox: aprovação, recusa, atraso, tolerância, cancelamento, reenvio e idempotência do webhook
  - Escopo do Control Plane (repositório `control-plane`): é a cobrança que a academia paga ao SysBelt.
- [ ] Homologar em sandbox o Mercado Pago das mensalidades e pedidos (Tenant Plane): roteiro em `docs/homologacao-mercadopago.md`
  - Parte automatizada concluída: assinatura, cada status do Mercado Pago, idempotência, entregas simultâneas, isolamento entre contas e pagamento recorrente (`WebhookMercadoPagoRota.test.ts`). Falta executar o roteiro manual com credenciais de teste.
- [ ] Validar a emissão, expiração, suspensão e renovação de concessões assinadas entre Control Plane e Tenant Plane
  - Lado do Tenant Plane coberto por `CicloConcessao.test.ts`: emissão, reenvio, renovação sem janela sem acesso, suspensão, expiração, recusas (adulterada, outra chave, outro tenant, emitida no futuro) e conflitos de revisão. A migration `20261023170000_concessao_plataforma_id_sequencial` corrige o banco, que só comportava uma concessão.
  - Pendente: decidir o comportamento ao expirar/suspender (seção abaixo) e validar a emissão pelo Control Plane.
- [ ] Executar teste de carga documentado para login, dashboard, listagem, criação de aula e webhook
- [ ] Configurar métricas e alertas para 5xx, latência p95, erros de webhook, falhas de job e expiração de concessão
- [ ] Executar backup e restauração em ambiente isolado, registrando RPO e RTO
- [ ] Configurar `RESEND_API_KEY` e `EMAIL_FROM` em produção e testar a redefinição de senha ponta a ponta (sem provedor, o e-mail não é entregue e o erro `email_provedor_ausente` aparece no log)
- [x] Resolver todos os avisos de lint e manter CI verde em pull request — concluído em 23/10/2026: API, três frontends e landings com `--max-warnings=0`/`html-validate` no CI (PRs #272, #273 e a validação das landings)

## Comportamento quando a concessão expira ou é suspensa

Decisão de produto pendente. Hoje o sistema faz o seguinte:

| Situação | Recursos do plano (WhatsApp, gateway automático, controle de acesso) | Uso geral (login e operação da academia) |
|---|---|---|
| Diretório do Control Plane desligado (`CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED` ≠ `true`) | Bloqueados assim que a concessão expira ou é suspensa | **Continua liberado**: a concessão não é consultada |
| Diretório ligado e respondendo | Bloqueados | Bloqueado (403) quando o Control Plane diz que a conta não está ativa |
| Diretório ligado e fora do ar | Bloqueados | Usa a concessão local; expirada ou suspensa → 503 |

Opções para o lançamento:

1. **Somente leitura**: com concessão expirada ou suspensa, a academia consulta os dados (alunos, financeiro, relatórios), mas não cadastra nem altera nada. É menos agressivo com quem atrasou um pagamento e preserva o acesso aos próprios dados.
2. **Bloqueio total**: o comportamento do diretório ligado, aplicado sempre.

Enquanto o diretório estiver desligado em produção, uma academia suspensa continua operando normalmente, só sem os recursos do plano.

## Matriz RBAC proposta

| Papel | Alcance | Pode administrar usuários | Pode operar financeiro | Pode conduzir aula |
|---|---|---|---|---|
| Dono | Todas as unidades da própria conta | Sim | Sim | Sim |
| Administrador | Unidades vinculadas | Sim, dentro do próprio alcance | Sim | Sim |
| Gerente (proposto) | Unidades vinculadas | Não | Sim, sem configurar gateway | Não por padrão |
| Recepção | Unidade ativa | Não | Operação diária, sem estorno/configuração | Não |
| Professor | Turmas/unidades vinculadas | Não | Não | Sim |
| Usuário comum (proposto) | Somente leitura definida por módulo | Não | Não | Não |

`GERENTE` e `USUARIO` ainda não existem como perfis no código. A tabela é uma proposta de produto; a criação desses papéis exige aprovação, migration do enum e testes de autorização antes de ser ativada.

## Teste de carga

O cenário versionado em `tests/load/smoke.js` exercita saúde, login e uma rota autenticada. Ele nunca contém credenciais: a execução requer URL e token de ambiente.

```bash
BASE_URL=https://sua-api.example/api TOKEN_DE_TESTE=... k6 run tests/load/smoke.js
```

Critério inicial de piloto: 50 VUs, 5 minutos, menos de 1% de falhas HTTP e p95 abaixo de 800 ms nas rotas consultadas. Aumentos de carga devem ser graduais e feitos fora do horário da academia.

## Sequência recomendada

1. Publicação e smoke tests dos sites
2. Segurança multi-conta e matriz RBAC
3. Cobrança, provisionamento e concessões em sandbox
4. Carga, observabilidade, backup/restauração
5. Piloto com duas a cinco academias antes da venda aberta
