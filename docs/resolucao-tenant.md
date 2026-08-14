# Resolução de tenant e banco exclusivo

> Desenho de referência para implementar a ADR-011 no Tenant Plane.

## Fluxo HTTP

```text
Navegador
  │ https://academia-x.app.sysbelt.com.br/api/...
  ▼
Netlify CDN / Function
  │ hostname original
  ▼
TenantResolutionMiddleware
  ├─ normaliza e valida hostname
  ├─ resolve slug no diretório do Control Plane
  ├─ verifica situação do ambiente
  ├─ obtém referência segura da conexão
  └─ associa tenant + PrismaClient ao contexto assíncrono
       │
       ▼
Autenticação
  ├─ login consulta usuário somente no banco resolvido
  └─ demais rotas conferem token.tenantKey === contexto.tenantKey
       │
       ▼
Controller → Service → prismaDoContexto() → banco exclusivo
```

## Componentes previstos

### `TenantHostParser`

Função pura que recebe o hostname e devolve um slug validado. Deve:

- remover porta apenas em desenvolvimento;
- rejeitar caracteres fora de `[a-z0-9-]`;
- rejeitar slug vazio, reservado ou excessivamente longo;
- aceitar somente o domínio-base configurado;
- nunca escolher um tenant padrão.

Slugs reservados iniciais: `www`, `api`, `admin`, `app`, `status`, `support`
e `control`.

A função pura está implementada em `src/shared/tenant/TenantHostParser.ts`.
Ela exige exatamente um subdomínio sob `TENANT_APP_BASE_DOMAIN`, normaliza
caixa e só remove porta quando o modo de desenvolvimento é informado
explicitamente. Host desconhecido, domínio parecido e subdomínio aninhado não
produzem tenant padrão.

### `TenantDirectory`

Interface de leitura do diretório central. A implementação consulta o Control
Plane e devolve apenas dados necessários ao roteamento:

```ts
interface TenantResolvido {
  tenantKey: string;
  slug: string;
  status: "ATIVO" | "SUSPENSO";
  secretRef: string;
  schemaVersion: string;
}
```

O diretório não devolve dados de alunos nem credenciais diretamente ao
navegador.

`TenantDirectoryHttp` implementa essa fronteira no backend com segredo
dedicado, timeout curto e validação estrita do contrato. Apenas `404` significa
tenant ausente; timeout, erro de autenticação e resposta inesperada falham
fechado como indisponibilidade, sem reutilizar banco ou resposta anterior.

### `TenantSecretProvider`

Resolve `secretRef` para a URL pooled do banco. O valor existe apenas no
backend e nunca entra em logs, respostas, JWT ou eventos de analytics.

`TenantSecretProviderAws` implementa a leitura no AWS Secrets Manager e valida
o `tenantKey`, a versão da credencial e o protocolo PostgreSQL. O retorno
omite URL direta e chave privada de integração; qualquer falha é sanitizada
antes de atravessar essa fronteira.

### `TenantPrismaRegistry`

Mantém, por instância aquecida da função, um cache limitado de clientes:

- chaveado por `tenantKey`, nunca por slug isolado;
- limite configurável e baixo;
- atualização quando a referência/versão da conexão mudar;
- remoção por ociosidade;
- `$disconnect()` na remoção;
- métricas de acerto, criação, remoção e erro sem registrar URLs.

Cada cliente usa URL pooled própria do tenant. A URL direta fica reservada a
jobs administrativos e migrations.

`TenantPrismaRegistry` implementa o cache por `tenantKey`, deduplica criações
concorrentes, invalida o cliente quando `credentialVersion` muda e chama
`$disconnect()` tanto na expiração por ociosidade quanto na remoção LRU. O
limite é defensivo e nunca usa slug ou URL como chave.

### `ContextoTenant`

Usa contexto assíncrono para expor durante a requisição:

```ts
interface ContextoTenant {
  tenantKey: string;
  slug: string;
  prisma: PrismaClient;
  requestId: string;
}
```

`prismaDoContexto()` lança erro se usado fora de um contexto resolvido. Não há
fallback para `DATABASE_URL` em produção.

`ContextoTenant` implementa essa fronteira com `AsyncLocalStorage`, identidade
imutável e falha explícita fora de uma requisição resolvida. Testes concorrentes
garantem que tenant e cliente Prisma de uma requisição não aparecem em outra.

## Ordem dos middlewares

```text
requestId / observabilidade
→ resolução do tenant e banco
→ captura do contexto de auditoria
→ CORS baseado no hostname canônico
→ parser do corpo
→ autenticação da rota
→ controller
→ error handler
```

Endpoints do próprio Control Plane ficam em outro deploy e não passam por
esse middleware.

`criarResolucaoTenantMiddleware` encadeia parser, diretório, cofre e registro
Prisma antes de abrir o contexto assíncrono. Host inválido/ausente responde
404, suspensão responde 403 antes de acessar segredo, e indisponibilidade do
diretório ou cofre responde 503 sem revelar infraestrutura. A instalação no
`app` ocorrerá somente após autenticação e services deixarem o Prisma global.

`infraTenant.ts` compõe uma única instância aquecida do diretório com cache,
provedor AWS e registro Prisma. Todas as dimensões de cache são configuráveis
dentro de limites defensivos; produção exige HTTPS para o Control Plane e
configuração incompleta interrompe a ativação em vez de escolher um banco.

O `app` instala `criarResolucaoTenantAtivavel()` antes de auditoria,
autenticação e rotas. Com `TENANT_RESOLUTION_ENABLED=false`, nenhuma
infraestrutura é criada e o comportamento legado permanece. O modo obrigatório
não pode ser ligado sem o middleware, evitando um deploy parcialmente ativado.

`GET /health/tenant-resolution` fica antes do middleware e informa se o modo
legado está pronto para o corte ou se uma ativação está inconsistente. A
resposta contém somente booleanos e estado; nomes de tenant, domínio, região,
URL, segredo e connection string nunca são devolvidos.

## Tokens

Exemplo conceitual de claims:

```json
{
  "sub": "123",
  "tenantKey": "tnt_opaque_id",
  "perfil": "ADMIN",
  "iss": "sysbelt-tenant-plane",
  "aud": "sysbelt-web",
  "exp": 1786400000
}
```

Regras:

- o token nunca contém URL ou credencial do banco;
- hostname e claim precisam convergir para o mesmo `tenantKey`;
- troca de unidade continua dentro do mesmo banco e usa `unidadeId`;
- suspensão comercial deve ser revalidada por concessão de curta duração ou
  estado local assinado, a ser definido no contrato entre os sistemas.

O contrato em `tokenTenant.ts` inclui `tenantKey`, emissor fixo e audiência
opcional na assinatura. A validação exige igualdade com o tenant já resolvido;
um JWT criptograficamente válido emitido no ambiente A é recusado no ambiente
B, e claims fornecidos pelo chamador não podem sobrescrever essa identidade.

## Falhas e respostas

| Situação | Resposta | Acesso a banco operacional |
|---|---:|---|
| hostname inválido ou desconhecido | 404 | nenhum |
| ambiente provisionando ou com erro | 503 | nenhum |
| assinatura/ambiente suspenso | 403 | nenhum, salvo rota informativa controlada |
| segredo indisponível | 503 | nenhum |
| banco indisponível | 503 | somente tentativa no banco resolvido |
| token de outro tenant | 401 | nenhum após a divergência |
| schema incompatível | 503 | nenhum acesso funcional |

Mensagens externas não devem revelar provedor, nome do banco, região,
connection string ou existência de outro assinante.

## Cache do diretório

Para reduzir dependência síncrona do Control Plane, a resolução poderá usar
cache curto por slug. Regras mínimas:

- TTL pequeno e configurável;
- resultado negativo com TTL ainda menor;
- suspensão invalida ou expira rapidamente;
- segredo não fica no mesmo cache de metadados;
- indisponibilidade nunca permite escolher outro tenant;
- cache vencido não é usado indefinidamente para operações sensíveis.

Os valores exatos serão definidos com testes de carga e requisitos comerciais
de suspensão.

`TenantDirectoryCache` aplica inicialmente 30 segundos para resultados
positivos e 5 segundos para ausências, deduplica consultas concorrentes e
limita a memória por LRU. Falhas do Control Plane nunca são armazenadas e a
entrada pode ser invalidada imediatamente após mudança operacional.

## Impacto no código atual

O arquivo `src/shared/database/prisma.ts` hoje exporta uma instância fixa. A
migração deverá acontecer em etapas:

1. introduzir `prismaDoContexto()` mantendo adaptador apenas para testes;
2. adicionar resolução antes das rotas operacionais;
3. migrar services e middlewares para o cliente contextual;
4. vincular tokens ao `tenantKey`;
5. adaptar login e portais;
6. remover o cliente operacional global;
7. remover do Tenant Plane as rotas do módulo `plataforma`.

Login administrativo, revalidação da sessão e login/guard do Portal da Família
já usam `prismaDaRequisicao()`. Durante a implantação, o adaptador mantém o
cliente legado somente com `TENANT_RESOLUTION_REQUIRED=false`; ao ativar a
variável, qualquer autenticação sem contexto resolvido falha fechada. Essa
trava permite configurar domínio, diretório e AWS antes do corte definitivo.

Nenhuma etapa deve permitir que uma requisição parcialmente migrada caia no
banco de outro cliente.

## Validação de segurança

Antes de produção, testes automatizados devem provar que:

- dois hostnames resolvem clientes Prisma diferentes;
- usuário e token de A são recusados no hostname B;
- hostname desconhecido não consulta banco padrão;
- header forjado não troca o tenant;
- duas requisições concorrentes não trocam seus contextos;
- cache não devolve cliente após rotação do segredo;
- suspensão bloqueia novas requisições no prazo acordado;
- logs e erros não contêm connection strings.

## Referências técnicas

- [Prisma — gerenciamento de conexões](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management)
- [Prisma — otimização e reutilização do PrismaClient](https://docs.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance)
- [Neon — multitenancy com banco/projeto por tenant](https://neon.com/docs/guides/multitenancy)
- [Neon — connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Netlify — configuração de Functions](https://docs.netlify.com/build/functions/configuration/)
- [Netlify — domínios e certificados wildcard](https://docs.netlify.com/manage/domains/configure-domains/delegate-a-standalone-subdomain/)
# Emissão de contagens

Cada Tenant Plane envia diariamente ao Control Plane um snapshot agregado por
unidade. A função agendada usa `TENANT_KEY` e assina o contrato v1 com
`TENANT_INTEGRATION_PRIVATE_KEY`; nenhuma linha de aluno deixa o banco
exclusivo. A chave deve ser configurada como segredo no site Netlify da
academia.
