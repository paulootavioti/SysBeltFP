# Sprint 01 — Fundação de confiança

## Objetivo

Garantir que equipe, professores e famílias consigam acessar e recuperar suas
contas, pedir suporte de verdade e informar um identificador rastreável quando
uma requisição falhar.

## Entregas

- builds restaurados nos portais da Família e do Professor;
- rate limit nos logins da equipe, professor e família;
- rate limit separado para recuperação de senha;
- recuperação de senha por e-mail nos três aplicativos;
- tokens aleatórios, armazenados como hash, com validade de uma hora e uso único;
- integração de e-mail via Resend, com modo de log somente em desenvolvimento;
- chamados de suporte persistidos no banco e notificados por e-mail;
- request id em `X-Request-Id` e nas respostas de erro inesperado;
- logs HTTP estruturados em JSON, com duração, status, rota e usuário;
- endpoint `GET /health`;
- timeout da suíte de integração adequado ao PostgreSQL real.

## Configuração de produção

```env
LOGIN_RATE_LIMIT_MAX=10
APP_WEB_URL=https://app.seu-dominio.com
PORTAL_FAMILIA_URL=https://familia.seu-dominio.com
PORTAL_PROFESSOR_URL=https://professor.seu-dominio.com
RESEND_API_KEY=re_...
EMAIL_FROM=SysBelt <acesso@seu-dominio.com>
SUPPORT_EMAIL=suporte@seu-dominio.com
```

O domínio usado em `EMAIL_FROM` precisa estar validado no Resend. Sem as
credenciais, o ambiente local imprime o e-mail no console; produção deve
configurar o provedor antes da publicação.

## Verificação

- backend: 152 arquivos e 712 testes;
- frontend da equipe: 14 arquivos e 91 testes;
- Portal da Família: 5 arquivos e 42 testes;
- Portal do Professor: 6 arquivos e 49 testes;
- builds de produção aprovados nos três frontends;
- migrations aplicadas nos bancos locais `sysbelt` e `sysbelt_test`.

## Risco residual de dependências

O `npm audit --omit=dev` ainda informa alertas transitivos em ferramentas do
Netlify/OpenTelemetry e no pacote de configuração do Prisma. Não há alerta
crítico. A correção proposta para o Prisma exige downgrade forçado, por isso
não foi aplicada automaticamente nesta sprint. Esses pacotes devem ser
atualizados quando seus mantenedores publicarem versões compatíveis, com build
e suíte completa executados novamente.

## Sprint 02 — Pagamentos e contratos automáticos

1. consolidar checkout PIX e cartão recorrente;
2. criar painel de conciliação, retentativas e falhas de webhook;
3. integrar um provedor brasileiro de assinatura eletrônica;
4. exibir a trilha de eventos de pagamento e assinatura ao administrador;
5. adicionar testes ponta a ponta para contratação, cobrança e assinatura.
