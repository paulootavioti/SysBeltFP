# Deploy

Versão: 2.0

Última atualização: Julho/2026 (processo real via Netlify — substitui a descrição anterior baseada em Docker/Nginx, que nunca chegou a ser usada)

---

# Objetivo

Este documento descreve o processo real de implantação (deploy) do Sys Belt - Sistema Faixa Preta, que roda inteiramente na **Netlify** — não há Docker, Nginx ou servidor próprio em produção.

---

# Visão Geral

```
Git push (branch main)
        │
        ▼
   Netlify Build
        │
        ├── npm ci (backend)
        ├── npx prisma generate
        ├── npx prisma migrate deploy   ← aplica migrations pendentes no Postgres de produção
        └── cd sgcl-web && npm ci && npm run build
        │
        ▼
   Publica sgcl-web/dist (frontend estático)
        │
   Empacota src/ (backend) como Netlify Function
```

Frontend e backend são publicados juntos, a partir do mesmo repositório e do mesmo build — não são dois deploys separados.

---

# Configuração (`netlify.toml`)

```toml
[build]
  command = "npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && cd sgcl-web && npm ci --include=dev && npm run build"
  publish = "sgcl-web/dist"

[build.environment]
  NODE_VERSION = "20"
  NODE_ENV = "production"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[functions.api]
  included_files = ["node_modules/.prisma/client/**"]

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Pontos importantes:

- **A migration roda automaticamente a cada deploy** (`npx prisma migrate deploy` faz parte do build command) — não é preciso rodar manualmente, desde que o push para `main` dispare o deploy automático da Netlify.
- O frontend chama a API sempre em `/api/*` (mesma origem) — o redirect resolve para a function, então não há problema de CORS em produção.
- O backend inteiro (`src/app.ts`) é empacotado como uma única Netlify Function (`netlify/functions/api.ts`), usando `serverless-http`.

---

# Backend como Netlify Function

```ts
// netlify/functions/api.ts
import serverless from "serverless-http";
import { app } from "../../src/app";

export const handler = serverless(app, {
  basePath: "/api",
  binary: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});
```

O mesmo `app` do Express usado em desenvolvimento (`npm run dev` → `src/server.ts`) roda em produção dentro da function — não existe uma versão "de produção" separada do backend.

`included_files` garante que o Prisma Client gerado (`node_modules/.prisma/client/**`) vá junto no pacote da function.

---

# Variáveis de Ambiente

Configuradas em **Site settings → Environment variables** no painel da Netlify (nunca commitadas):

```
DATABASE_URL       # connection string do Postgres (recomendado: Neon com endpoint pooled)
JWT_SECRET
JWT_EXPIRES_IN     # ex.: "7d"
CORS_ORIGIN        # origens permitidas (pouco relevante em produção, já que front e back são same-origin via /api)
```

Localmente, essas mesmas variáveis ficam em `.env` (nunca commitado — ver `.env.example`).

Frontend (`sgcl-web/.env.local`, opcional):

```
VITE_API_URL=http://localhost:3333   # só em dev, apontando pro backend local
```

Em produção o frontend **não define** `VITE_API_URL` — usa `/api` (same-origin) automaticamente.

---

# Banco de Dados

**PostgreSQL** em todos os ambientes — não há SQLite em nenhum momento do fluxo. Recomendado usar um provedor com pooling para uso serverless (ex.: Neon, endpoint "pooled") — cada invocação da function pode abrir sua própria conexão.

---

# Migrations

Sempre geradas localmente com:

```bash
npx prisma migrate dev --name descricao_da_mudanca
```

Isso cria o arquivo em `prisma/migrations/` e já aplica no banco de desenvolvimento. Esse arquivo vai para o Git — é ele que a Netlify aplica automaticamente em produção via `prisma migrate deploy` durante o build.

**Nunca** rodar `prisma migrate dev` contra o banco de produção — é exclusivamente uma ferramenta de desenvolvimento local.

---

# Processo de Deploy (fluxo real)

1. Desenvolver e verificar localmente (`tsc`, `vitest`, `eslint`, `build` — ver `testes.md`).
2. Criar a migration, se houver mudança de schema (`npx prisma migrate dev`).
3. Commit + push para `main`.
4. Netlify detecta o push e dispara o build automaticamente (se o deploy automático estiver habilitado no site).
5. Build roda: instala dependências, gera o Prisma Client, **aplica as migrations pendentes no banco de produção**, builda o frontend.
6. Se o build passar, a nova versão é publicada (frontend estático + function atualizada).
7. Validar em produção: login, uma tela de cada módulo principal, uma chamada de API.

Se o build falhar (inclusive por uma migration com erro), a versão anterior continua no ar — a Netlify não publica um build quebrado.

---

# Rollback

A Netlify mantém o histórico de deploys anteriores — um rollback é feito publicando novamente (via painel) um deploy anterior já buildado. Isso **não** reverte migrations de banco já aplicadas — uma mudança de schema incompatível exige uma migration reversa própria, criada e testada como qualquer outra.

---

# Domínio e SSL

Gerenciados pela Netlify (certificado automático via Let's Encrypt, renovação automática). Não há configuração manual de Nginx/SSL.

---

# Logs e Monitoramento

Logs de build e das invocações da function ficam disponíveis no painel da Netlify (aba Functions/Deploys). Não há stack próprio de observabilidade (Prometheus/Grafana/Sentry) configurado hoje — ver seção "Roadmap".

---

# Checklist de Deploy

Antes

- Código revisado
- `tsc --noEmit`, `vitest run`, `eslint` e `build` passando (backend e frontend)
- Migration criada e testada localmente, se houver

Depois (produção)

- Login funcionando
- Uma tela de cada módulo principal carregando
- Migration aplicada (checar log de build da Netlify)
- Nenhum erro novo nos logs da function

---

# Roadmap

Próximas melhorias

- Ambiente de homologação separado (branch deploy / preview deploys da própria Netlify)
- Observabilidade (Sentry para erros de function)
- Backup automatizado do banco (hoje depende do backup nativo do provedor Postgres, ex.: Neon)
- CI rodando a suíte de testes antes do deploy (hoje a verificação é manual, antes do push)

---

# Conclusão

O processo de deploy do Sys Belt é intencionalmente simples: um único `git push` para `main` aciona build, migration e publicação de frontend e backend juntos, sem infraestrutura própria para gerenciar.
