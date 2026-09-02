# Arquitetura multitenant com banco compartilhado

Versao: 1.0  
Decisao vigente desde: 31/08/2026

## Regra obrigatoria

O Sys Belt usa **um unico banco PostgreSQL operacional compartilhado por todos
os assinantes**. O compartilhamento e de infraestrutura, nunca de acesso:
nenhum assinante pode ler, alterar, inferir ou exportar dados de outro.

Esta decisao substitui o desenho anterior de um banco exclusivo por academia.
Nao devem ser criados bancos, schemas, usuarios PostgreSQL ou connection
strings por assinante.

## Hierarquia de dados

```text
Banco operacional compartilhado
  Conta A (assinante/tenant)
    Unidade A1
    Unidade A2
  Conta B (assinante/tenant)
    Unidade B1
```

- `Conta` e a fronteira entre assinantes.
- `Unidade` e uma filial e sempre pertence a exatamente uma `Conta`.
- dados operacionais pertencem a uma unidade, diretamente por `unidadeId` ou
  por uma relacao que conduza sem ambiguidade ate ela.
- o `DONO` alcanca todas as unidades da propria conta, nunca todas as contas.
- demais perfis alcancam somente as unidades autorizadas da propria conta.
- o e-mail de `Usuario` e uma identidade global e permanece unico no banco.

## Aplicacao do isolamento

Em requisicoes autenticadas, `ensureAuthenticated` carrega o usuario e
preenche `unidadesDoUsuario` com as unidades da conta autorizada. As consultas
usam `escopoUnidade`, `garantirAcessoUnidade`, `requireUnidadeId` e
`garantirUnidadesDaMesmaConta`.

Um filtro fornecido pela tela apenas restringe o alcance calculado pelo
servidor. `unidadeId`, `contaId`, perfil ou lista de unidades enviados pelo
cliente nunca ampliam autorizacao.

O isolamento atual e aplicado pela aplicacao e por testes; PostgreSQL RLS nao
esta habilitado. RLS pode ser adicionado como defesa em profundidade, mas nao
substitui as verificacoes da aplicacao.

### Decisao sobre RLS

RLS fica **adiado**, nao descartado. O Prisma usa pool de conexoes e o sistema
ainda nao instala `contaId` transacional (`SET LOCAL`) em toda operacao. Ativar
policies antes disso produziria falsa seguranca ou bloqueios intermitentes.
O criterio para adocao e: transacao por requisicao/job, contexto de conta no
PostgreSQL, policy para todas as tabelas operacionais e testes que tentem
acesso cruzado tanto pela API quanto por SQL. Ate la, escopo de aplicacao e
testes negativos sao controles obrigatorios.

## Fluxos sem usuario

Rotas publicas, webhooks e jobs nao podem usar ausencia de usuario como
atalho para ausencia de tenant:

- paginas publicas resolvem uma unidade por identificador publico e continuam
  escopadas nela;
- webhooks resolvem o canal externo e derivam dele `unidadeId` e `Conta`;
- jobs globais iteram contas/unidades explicitamente e registram cada lote;
- jobs de uma conta recebem `contaId` ou uma lista validada de unidades;
- erros e logs nao revelam se um registro pertence a outro assinante.

O retorno irrestrito de `escopoUnidade(null)` para rotinas sem usuario e uma
compatibilidade que deve ser tratada como operacao global deliberada, nunca
chamada a partir de uma rota de assinante.

## Control Plane e dominios

O Control Plane administra contratacao, plano, cobranca, concessoes, dominios
e estado do assinante. Ele nao provisiona banco por tenant e nao entrega
credenciais de banco ao runtime.

Hostname ou slug pode identificar a `Conta`, mas nunca seleciona outro
`PrismaClient`: toda requisicao usa a mesma `DATABASE_URL` compartilhada.

A infraestrutura de selecao multi-banco foi removida. A concessao assinada
continua valida como entitlement, vinculada a uma `Conta` no banco
compartilhado.

## Operacao do banco

- migrations rodam uma vez por ambiente no banco compartilhado;
- deploys destrutivos seguem expand/contract e backfill escopado;
- backup e PITR cobrem o banco inteiro;
- restauracao de uma conta exige recuperacao seletiva em ambiente isolado;
- observabilidade usa `contaId`, `unidadeId` e `requestId`, sem PII;
- onboarding cria `Conta`, unidade inicial, assinatura e dono em transacao
  idempotente; nao cria infraestrutura de banco.

## Checklist para qualquer modulo novo

1. Toda entidade operacional possui caminho obrigatorio ate `Conta`.
2. Listas, buscas, exportacoes, agregacoes e dashboards aplicam escopo.
3. Leitura ou alteracao por ID valida a unidade depois da busca.
4. `connect`, `upsert`, idempotencia e unicidades nao cruzam contas.
5. Vinculos confirmam que as entidades pertencem a mesma conta.
6. Rotas publicas, jobs e webhooks derivam escopo de origem confiavel.
7. Testes usam duas contas e provam a negativa de acesso cruzado.
8. Cache, arquivos, filas, metricas e logs sao particionados por conta.
9. Mensagens externas nao confirmam dado de assinante vizinho.
10. A revisao procura consultas Prisma sem escopo ou validacao equivalente.

## Estado das pendencias em 31/08/2026

- concluir a retirada das referencias historicas ao provisionamento multi-banco
  no Control Plane;
- infraestrutura de selecao de banco removida do runtime;
- `ConcessaoPlataforma` associada por `contaId` e `tenantKey`;
- auditoria multitenant valida contas, vinculos, concessoes e perfis legados;
- crons financeiros, contratuais e WhatsApp particionados por conta/unidade;
- snapshots do Control Plane gerados separadamente por conta;
- RLS adiado conforme os criterios acima;
- teste de restauracao seletiva continua como tarefa operacional de ambiente.
