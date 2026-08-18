# Deploy

Versão do documento: 2.0

Última atualização: Agosto/2026

---

# Objetivo

Descrever como publicar o Sys Belt, quais sites existem, o que cada um lê de
ambiente e quais passos são manuais por decisão.

---

# Ambientes

Existem dois ambientes reais: **desenvolvimento local** e **produção**. Não há
homologação. O documento anterior descrevia SQLite em desenvolvimento e um
ambiente Docker de homologação — ambos foram descontinuados.

| | Desenvolvimento | Produção |
|---|---|---|
| Banco | PostgreSQL local | PostgreSQL gerenciado (Neon) |
| Backend | `npm run dev` (ts-node-dev) | Netlify Functions |
| Frontend | Vite dev server | Netlify (estático) |

---

# Sites publicados

Todos saem do mesmo repositório, diferenciados pelo **base directory**:

| Site | Base directory | O que é |
|---|---|---|
| `sysbeltfp` | *(raiz)* | Tenant Plane (API) + `sgcl-web` |
| `sysbelt-control-plane` | `control-plane` | Control Plane B2B |
| `sysbeltportalfamilia` | `sgcl-portal-familia` | Portal da Família |
| `portalprofessorsysbelt` | `sgcl-portal-professor` | Portal do Professor |
| `ciadelutas` | `landing-academia` | Site institucional da academia |

Quando o base directory está definido, o Netlify lê o `netlify.toml`
**daquele diretório**, e os caminhos de `publish` e `functions` são relativos
a ele.

---

# Tenant Plane (`sysbeltfp`)

## Build

`netlify.toml` da raiz:

```toml
command = "npm ci --include=dev && npx prisma generate && DATABASE_URL=${DIRECT_DATABASE_URL:-$DATABASE_URL} npx prisma migrate deploy && cd sgcl-web && npm ci --include=dev && npm run build"
publish = "sgcl-web/dist"
```

Dois detalhes que parecem redundantes e não são:

**`--include=dev`** é obrigatório porque `NODE_ENV = "production"` está
definido em `[build.environment]`. Com essa variável, o npm omite
`devDependencies` — e o build quebra em `tsc` com
`TS2688: Cannot find type definition file for 'node'`. O erro engana: o `tsc`
sobrevive como dependência transitiva, então o comando roda e falha na
resolução de tipos, apontando para tipos em vez de para dependência faltando.

**`DIRECT_DATABASE_URL`** existe porque `prisma migrate deploy` usa uma trava
de sessão (`pg_advisory_lock`) que não funciona de forma confiável através de
um pooler. Contra o endpoint `-pooler` do Neon, isso causa timeouts
intermitentes (P1002). Só esse comando roda com a conexão direta; se a
variável não existir, cai no `DATABASE_URL` de sempre, sem mudança de
comportamento.

## Variáveis

| Variável | Papel |
|---|---|
| `DATABASE_URL` | Banco operacional |
| `DIRECT_DATABASE_URL` | Conexão direta, só para migrations |
| `JWT_SECRET` | Assinatura dos tokens |
| `CHAVE_SEGREDOS` | Cofre AES-256-GCM das credenciais de gateway (32 bytes em hex = 64 caracteres) |
| `CORS_ORIGIN` | Origens permitidas |
| `TENANT_RESOLUTION_ENABLED` | Liga a resolução por hostname |
| `TENANT_RESOLUTION_REQUIRED` | Torna o contexto de tenant obrigatório |
| `CONTROL_PLANE_URL` | Origem do Control Plane (sem caminho) |
| `TENANT_DIRECTORY_SECRET` | Segredo compartilhado do diretório |
| `TENANT_APP_BASE_DOMAIN` | Domínio base dos tenants |
| `TENANT_SCHEMA_COMPATIBLE_VERSIONS` | Migrações aceitas nos bancos de tenant |
| `AWS_REGION` | Região do Secrets Manager |

> **`CHAVE_SEGREDOS` nunca vai para o Git.** Rotacioná-la torna ilegíveis todas
> as credenciais já cifradas.

> **`CONTROL_PLANE_URL` deve ser só a origem.** O caminho é montado com
> `new URL("/api/diretorio/v1/tenants/<slug>", base)` — um caminho absoluto
> descarta qualquer caminho presente na base. Escrever `.../api` não quebra
> nada, mas fica no painel parecendo que significa algo.

---

# Control Plane (`sysbelt-control-plane`)

## Configuração do site

| Campo | Valor |
|---|---|
| Base directory | `control-plane` |
| Build command | `npm ci --include=dev && npm run build:completo` |
| Publish | `web/dist` |
| Functions | `dist/netlify/functions` |

Os três últimos vêm do `control-plane/netlify.toml` e não precisam ser
preenchidos na interface — o arquivo prevalece sobre o painel.

O site publica **duas coisas ao mesmo tempo**: a API, como function, e o painel
do operador (`control-plane/web`), como estático. Eles compartilham a origem de
propósito — o painel chama `/api` no próprio host, então não há CORS, não há
variável de URL para manter em dia e não existe a possibilidade de o painel
apontar para um Control Plane diferente do que o serve.

O `netlify.toml` traz um fallback de SPA (`/*` → `/index.html`) **depois** da
regra de `/api/*`. A ordem importa: o Netlify aplica a primeira regra que
casar, e invertendo-as toda chamada de API viraria o HTML do painel.

O `build` usa `tsconfig.build.json`, que exclui `**/*.test.ts`. Sem isso, o
`tsc` emitiria `dist/netlify/functions/provisionar-background.test.js`, e o
Netlify trata **cada arquivo desse diretório como uma serverless function** — o
ponto no nome é caractere inválido, e o deploy inteiro é abortado, não apenas
aquela function. A checagem de tipos dos testes não se perde: `npm run
typecheck` continua usando o `tsconfig.json` completo, e a CI roda os dois.

## Variáveis

| Variável | Obrigatória | Papel |
|---|---|---|
| `CONTROL_PLANE_DATABASE_URL` | sim | Banco comercial |
| `CONTROL_PLANE_JWT_SECRET` | sim | Tokens de operador |
| `CONTROL_PLANE_DIRECTORY_SECRET` | sim | Segredo do diretório (≥ 32 caracteres) |
| `CONTROL_PLANE_GRANT_PRIVATE_KEY` | para concessões | Chave Ed25519 |
| `CONTROL_PLANE_WORKER_SECRET` | para provisionamento | Autentica o worker |
| `PROVISIONAMENTO_REAL_HABILITADO` | não | Mantida `false` até cofre e Neon prontos |
| `NEON_API_KEY`, `AWS_*` | para provisionamento | Adaptadores de infraestrutura |

As não definidas **falham fechado**: o worker de provisionamento responde 503
enquanto `PROVISIONAMENTO_REAL_HABILITADO` não for `true`, que é o estado
desejado enquanto o caminho não está pronto.

`CONTROL_PLANE_DIRECTORY_SECRET` e `TENANT_DIRECTORY_SECRET` são **o mesmo
segredo** com nomes diferentes nos dois lados. Gere com:

```bash
openssl rand -hex 32
```

## Migrações

O `build` do Control Plane é apenas `tsc` — **não aplica migrações**. Este
passo é manual e precede o primeiro deploy:

```bash
cd control-plane
CONTROL_PLANE_DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Esperado: `8 migrations found` e `All migrations have been successfully
applied.`

---

# Verificação pós-deploy

## Control Plane

```bash
curl -s https://sysbelt-control-plane.netlify.app/api/health
# {"service":"sysbelt-control-plane","status":"ok"}

curl -i https://sysbelt-control-plane.netlify.app/api/diretorio/v1/tenants/teste
# 401 — {"mensagem":"Integração não autorizada."}

curl -i -H "x-sysbelt-directory-secret: $SEGREDO" \
  https://sysbelt-control-plane.netlify.app/api/diretorio/v1/tenants/teste
# 404 — autenticado; o tenant "teste" não existe
```

O **404 é o teste que importa**. Os outros dois provam que a function subiu; só
o terceiro prova que o segredo bate dos dois lados.

## Tenant Plane

```bash
curl -s https://sysbeltfp.netlify.app/api/health/tenant-resolution
```

```json
{
  "service": "tenant-resolution",
  "status": "legacy",
  "habilitada": false,
  "obrigatoria": false,
  "configuracaoValida": true,
  "awsConfigurada": true,
  "prontaParaAtivar": true
}
```

> **`prontaParaAtivar: true` não prova conectividade.**
> `lerConfiguracaoResolucaoTenant` não faz nenhuma chamada de rede. O verde diz
> que as variáveis existem e têm formato aceitável — nada mais. Um segredo
> digitado errado num dos lados continua dando verde aqui.

Ou, pelo script, que também recusa combinações inconsistentes de flags:

```bash
npm run tenant:preflight -- --fase=configuracao https://sysbeltfp.netlify.app
```

---

# Testar sem publicar

Útil quando o build está indisponível — por exemplo, com os minutos de build
do plano esgotados.

Rodando local, **não há prefixo `/api`**: ele vem do wrapper serverless
(`serverless(app, { basePath: "/api" })`), não do Express.

```bash
cd control-plane && npm run dev          # API na porta 3334
curl -s localhost:3334/health
curl -i -H "x-sysbelt-directory-secret: $SEGREDO" \
  localhost:3334/diretorio/v1/tenants/teste
```

Para o painel do operador, com a API já rodando:

```bash
cd control-plane/web && npm run dev      # painel na porta 5177
```

O Vite encaminha `/api` para a 3334 e remove o prefixo, reproduzindo o arranjo
de produção — onde o `/api` é criado pelo wrapper serverless, não pelo Express.

```bash
npm run dev                              # porta 3333
curl -s localhost:3333/health/tenant-resolution
```

Local aceita `http://` em `CONTROL_PLANE_URL`: a exigência de HTTPS em
`infraTenant.ts` só se aplica quando `NODE_ENV === "production"`.

Para publicar sem consumir minutos de build, compile na máquina e envie o
artefato pronto:

O caminho recomendado é o workflow **Deploy Control Plane** do GitHub Actions
(`.github/workflows/deploy-control-plane.yml`). Ele roda a cada push no `main`
que toque em `control-plane/`, e também sob demanda pelo botão *Run workflow*.

Como o build acontece nos runners do GitHub e só o artefato pronto é enviado,
esse caminho **não consome minutos de build do Netlify** — funciona mesmo com
a cota esgotada.

Exige dois segredos no repositório (Settings → Secrets and variables →
Actions):

| Segredo | Onde obter |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → New access token |
| `NETLIFY_SITE_ID` | Netlify → o site → Site configuration → Site ID |

O workflow roda a suíte antes de publicar. O workflow de CI só dispara em
pull request, então um push direto no `main` chegaria ao deploy sem nenhuma
verificação.

## Publicando da própria máquina

```bash
cd control-plane
npm ci --include=dev
npm run build:completo
npx netlify-cli deploy --prod --dir=web/dist --functions=dist/netlify/functions
```

`build:completo` instala as dependências do painel antes de compilá-lo. Rodar
só `npm run build` compila a API e para aí; se `web/node_modules` não existir,
o build do painel falha com uma dezena de `Cannot find module` — e vários
aparecem como erro de tipo (`'unknown'`) em arquivos que não têm defeito
nenhum, por cascata da tipagem que não resolve.

> **A CLI do Netlify exige macOS 12 ou superior.** Em versões anteriores, o
> esbuild que ela traz aborta com
> `dyld: Symbol not found: _SecTrustCopyCertificateChain` — a API não existe
> nesses sistemas. Não é questão de permissão nem de forma de instalar:
> `npx`, `sudo` e prefixo de usuário falham igual. Nessas máquinas, use o
> workflow do GitHub Actions.

As variáveis de ambiente continuam vindo do painel do Netlify em qualquer um
dos dois caminhos.

---

# Cuidados em produção

**Backup antes de `prisma migrate deploy`.** Migrações deste projeto já
removeram colunas e tornaram `Unidade.contaId` `NOT NULL`.

**`TENANT_RESOLUTION_REQUIRED=true` com `ENABLED=false` derruba a API.** O
`throw` acontece na carga do módulo (`resolucaoTenantAtivavel.ts:10`) e nem o
health check responde. As duas variáveis nunca devem divergir nesse sentido —
ative sempre na ordem: configuração → habilitada → obrigatória.

**A suíte de testes apaga registros.** Ela recusa qualquer banco que não se
identifique como de teste. A escotilha `PERMITIR_TESTE_EM_BANCO_REAL=1` existe
para casos conscientes e imprime aviso — nunca a use contra produção.

**Segredos não entram em `.env` versionado, em commit, nem em chat.** Se um
vazar, rotacione antes de qualquer outra coisa.
