# Prontidão para lançamento comercial

Status: bloqueado até os critérios abaixo serem comprovados em ambiente de produção controlado.

## Decisão arquitetural

O Control Plane permanece isolado, em repositório, banco e autenticação próprios. Ele é a fonte de verdade comercial de assinantes, planos, faturas, cobrança e concessões. O Tenant Plane mantém somente a operação da academia e uma projeção assinada da concessão, validada localmente.

Não é pertinente reintroduzir o domínio comercial no Tenant Plane nem criar banco por academia agora. O banco operacional compartilhado, isolado por `Conta` e `Unidade`, é a decisão vigente (ADR-014). A evolução segura é reforçar testes de fronteira e manter o Control Plane como controlador externo.

## Gates de lançamento

- [ ] Corrigir a publicação independente dos três frontends e comprovar que todos consomem o commit de `main`
- [ ] Homologar duas contas reais de teste: leitura, escrita, busca por ID, upload, exportação, jobs e webhooks sem acesso cruzado
- [ ] Definir e aprovar matriz RBAC, incluindo a decisão sobre os papéis Gerente e Usuário comum
- [ ] Homologar o gateway de cobrança SaaS em sandbox: aprovação, recusa, atraso, tolerância, cancelamento, reenvio e idempotência do webhook
- [ ] Validar a emissão, expiração, suspensão e renovação de concessões assinadas entre Control Plane e Tenant Plane
- [ ] Executar teste de carga documentado para login, dashboard, listagem, criação de aula e webhook
- [ ] Configurar métricas e alertas para 5xx, latência p95, erros de webhook, falhas de job e expiração de concessão
- [ ] Executar backup e restauração em ambiente isolado, registrando RPO e RTO
- [ ] Resolver todos os avisos de lint e manter CI verde em pull request

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
