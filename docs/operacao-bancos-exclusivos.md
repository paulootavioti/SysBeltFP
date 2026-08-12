# Operação dos bancos exclusivos

> Runbook arquitetural do provisionamento, migrations, segredos, backup e
> encerramento dos ambientes de academia.

## Topologia inicial

```text
Organização Neon do Sys Belt
├── projeto control-plane
│   └── banco comercial central
├── projeto tenant_<tenantKey A>
│   └── banco operacional exclusivo da Academia A
├── projeto tenant_<tenantKey B>
│   └── banco operacional exclusivo da Academia B
└── projeto nonprod
    └── branches efêmeros de CI, preview e homologação

AWS Secrets Manager
├── sysbelt/prod/tenants/<tenantKey A>/database
└── sysbelt/prod/tenants/<tenantKey B>/database
```

O nome visível do projeto não é usado como identidade de segurança. O vínculo
é feito pelos identificadores imutáveis registrados no Control Plane.

## Inventário central

`AmbienteTenant` deverá registrar, sem senha:

- `tenantKey`;
- `provider = NEON`;
- `providerProjectId`;
- `providerBranchId`;
- `providerEndpointId`;
- `databaseName` e `roleName` operacionais;
- região e versão do PostgreSQL;
- `secretRef`;
- versão atual e desejada do schema;
- estado de provisionamento e saúde;
- última migration, backup verificado e rotação de credencial.

## Segredo por tenant

Estrutura lógica armazenada no gerenciador de segredos:

```json
{
  "pooledUrl": "postgresql://...-pooler...",
  "directUrl": "postgresql://...",
  "credentialVersion": 1
}
```

Regras:

- nunca salvar esse JSON no banco do Control Plane;
- nunca devolver `directUrl` ao runtime HTTP comum;
- marcar credenciais-raiz no Netlify Secrets Controller;
- separar chaves e segredos de produção, preview e desenvolvimento;
- não disponibilizar segredos de produção a Deploy Previews;
- sanitizar erros antes de persistir `EventoProvisionamento`;
- impedir logs de headers de autorização e connection strings;
- rotacionar imediatamente após suspeita de exposição.

## Fluxo de provisionamento

### Entrada

O operador conclui a contratação. A API:

1. cria `AmbienteTenant` como `PENDENTE`;
2. cria `EventoProvisionamento` com chave idempotente;
3. dispara o worker assíncrono;
4. responde sem aguardar criação e migrations.

### Worker

O worker executa etapas persistidas:

1. **reservar identidade:** confirma que há um único ambiente para o
   assinante;
2. **criar projeto:** chama a API Neon em região e PostgreSQL padronizados;
3. **aguardar operações:** consulta o estado até os recursos estarem prontos;
4. **capturar credenciais:** separa URL pooled e direta retornadas na criação;
5. **gravar segredo:** cria o segredo e confirma que pode ser relido;
6. **registrar inventário:** salva somente IDs e `secretRef`;
7. **migrar:** executa `prisma migrate deploy` pela conexão direta;
8. **bootstrap:** cria configuração do tenant e administrador inicial por
   comando idempotente;
9. **health check:** valida conexão, versão do schema e consulta mínima;
10. **ativar:** marca ambiente e assinante como ativos;
11. **notificar:** envia instrução de primeiro acesso fora do log técnico.

Cada etapa verifica se já foi concluída antes de executar. A criação de
projeto é uma operação não idempotente no provedor; em timeout incerto, o
worker reconcilia projetos por metadados registrados antes de tentar criar
outro.

## Estados e retomada

```text
PENDENTE
  → CRIANDO_PROJETO
  → GRAVANDO_SEGREDO
  → APLICANDO_MIGRATIONS
  → EXECUTANDO_BOOTSTRAP
  → VALIDANDO
  → ATIVO

qualquer etapa → FALHOU → retomar da última etapa confirmada
```

Um evento travado além do prazo gera alerta. Retentativas têm limite e
backoff; depois disso exigem ação do operador.

## Estratégia de migrations

### Classificação

- **compatível:** adiciona tabela/coluna opcional ou índice seguro;
- **transicional:** exige duas versões da aplicação durante migração;
- **arriscada:** remove, renomeia, reescreve volume alto ou bloqueia tabela.

Mudanças destrutivas seguem expand/contract:

1. expandir schema sem quebrar código antigo;
2. publicar código capaz de operar nos dois formatos;
3. executar backfill idempotente e observável;
4. confirmar que todos os tenants migraram;
5. remover uso antigo;
6. somente em versão posterior contrair o schema.

### Rollout

O job trabalha com lotes e trava por ambiente:

- compara versão atual e desejada;
- cria ponto de recuperação quando exigido;
- executa migration pela URL direta;
- realiza health check;
- registra duração e resultado;
- não executa duas migrations simultâneas no mesmo tenant;
- pausa o rollout quando a taxa de falha exceder o limite.

O Tenant Plane recusa operações funcionais quando sua versão estiver fora da
janela de compatibilidade do deploy atual.

## GitHub, Netlify e produção

```text
Pull request
  → GitHub Actions cria banco/branch efêmero
  → aplica migrations
  → executa testes
  → descarta ambiente

Merge em main
  → Netlify publica código
  → canário é migrado e validado
  → rollout assíncrono migra tenants em lotes
  → versão desejada é reconciliada periodicamente
```

O comando atual do `netlify.toml`, que aplica migration a um único
`DATABASE_URL` durante o build, será removido quando a arquitetura multi-banco
entrar em operação. Build não deve possuir acesso direto a todos os bancos de
produção.

## Backup

Camadas iniciais:

1. histórico/PITR nativo por projeto Neon;
2. snapshots agendados, conforme disponibilidade do plano;
3. exportação periódica independente para armazenamento controlado pelo Sys
   Belt quando os requisitos de recuperação exigirem segunda cópia.

Políticas mínimas a definir comercialmente:

- RPO: perda máxima aceitável de dados;
- RTO: tempo máximo para restaurar o serviço;
- janela de retenção por plano;
- região e residência dos dados;
- criptografia e retenção das exportações;
- frequência de testes de restauração.

Um teste de restauração deve usar ambiente isolado, verificar migrations,
contagens básicas e autenticação, e destruir o ambiente temporário depois.

## Rotação de credenciais

1. criar ou redefinir credencial no projeto do tenant;
2. testar nova URL pooled e direta;
3. gravar nova versão do segredo;
4. atualizar `credentialVersion` no inventário;
5. invalidar caches do Tenant Plane;
6. observar erros de conexão;
7. revogar credencial anterior;
8. registrar auditoria.

Nunca revogar primeiro: isso transforma rotação em indisponibilidade.

## Suspensão, cancelamento e exclusão

### Suspensão

- bloqueia acesso funcional;
- preserva banco, backups e inventário;
- não reduz automaticamente a janela de recuperação.

### Cancelamento

- impede novas cobranças conforme regra contratual;
- inicia período de retenção;
- oferece exportação quando aplicável;
- mantém projeto inacessível à academia.

### Exclusão definitiva

Exige:

- prazo de retenção encerrado;
- inexistência de obrigação legal ou financeira de preservação;
- confirmação forte por operador autorizado;
- snapshot/exportação final quando previsto;
- remoção do projeto Neon;
- remoção do segredo;
- preservação apenas da auditoria e prova de exclusão permitidas.

Excluir projeto Neon é irreversível. A ação ficará fora de rotas comuns e não
terá retentativa automática cega.

## Monitoramento e alertas

Alertas mínimos:

- provisionamento falhou ou ficou travado;
- segredo não pode ser lido;
- banco não responde;
- schema atrasado ou incompatível;
- migration falhou;
- backup/PITR fora da política;
- restauração de teste vencida;
- limite de projetos ou consumo próximo do teto;
- rotação de credencial atrasada;
- tentativas de resolver hostname para tenant inexistente.

Métricas e logs usam `tenantKey` opaco, nunca connection string ou dado de
aluno.

## Referências técnicas

- [Neon API — criar projeto](https://api-docs.neon.tech/reference/createproject)
- [Neon — gerenciamento de projetos](https://neon.com/docs/manage/projects)
- [Neon API — casos de uso](https://api-docs.neon.tech/reference/use-cases)
- [Netlify — Background Functions](https://docs.netlify.com/build/functions/background-functions/)
- [Netlify — Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/)
- [AWS Secrets Manager — boas práticas](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
