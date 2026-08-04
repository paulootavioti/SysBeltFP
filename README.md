# Sys Belt - Sistema Faixa Preta

> Plataforma de gestão multi-unidade para academias de Jiu-Jitsu, unindo administração, financeiro e planejamento pedagógico.

Projeto desenvolvido para a **Cia de Lutas Weberty Viana**.

---

## O que é

O Sys Belt centraliza a gestão de uma ou mais unidades (filiais) de uma academia: alunos, responsáveis, turmas, arenas (tatames/salas), aulas, planejamento pedagógico, graduações, financeiro, competições e relatórios. Cada unidade tem seus dados isolados dos demais — o sistema é multi-tenant desde a base.

## Estrutura do repositório

```
sysbeltfp/
├── src/                    # backend (API REST — Express + Prisma + PostgreSQL)
├── sgcl-web/               # frontend da equipe (React + TypeScript + Vite)
├── sgcl-portal-familia/    # Portal da Família — app separado (React + TypeScript + Vite)
├── prisma/                 # schema.prisma e migrations
├── docs/                   # documentação completa do projeto
└── netlify/                # functions usadas no deploy (Netlify)
```

## Como rodar localmente

### Backend

```bash
npm install
npm run dev
```

Servidor em `http://localhost:3333` (configurável via `PORT`). Requer um `.env` com `DATABASE_URL` (PostgreSQL) e `JWT_SECRET` — veja `.env.example`.

### Frontend (equipe)

```bash
cd sgcl-web
npm install
npm run dev
```

Aplicação em `http://localhost:5173`.

### Portal da Família (responsáveis e alunos)

App **separado** do frontend da equipe — outro pacote, outra porta, outro login (não usa a tabela `Usuario`, e sim `Responsavel`/`Aluno` com `senhaPortal`). Consome a mesma API do backend (`/portal-familia/*`).

```bash
cd sgcl-portal-familia
npm install
npm run dev
```

Aplicação em `http://localhost:5175`. O backend já libera CORS para as duas origens (`5173` e `5175`) por padrão — se mudar a porta, ajuste `CORS_ORIGIN` no `.env` do backend.

A tela de login do `sgcl-web` (equipe) lista **dois portais** em "Outros acessos": **Portal do Professor** e **Portal da Família**, cada um com sua própria variável de ambiente — `VITE_PORTAL_PROFESSOR_URL` e `VITE_PORTAL_FAMILIA_URL` (ambas em `sgcl-web/.env.local`), úteis quando cada portal está publicado em domínios diferentes.

#### Regra de maioridade (quem acessa o quê)

O acesso é recalculado a cada login **e a cada requisição** a partir da idade atual do aluno (nunca fica cravado na sessão) — implementado em `src/modules/portalFamilia/utils/calcularEscopoFamilia.ts`, reaproveitado tanto no login quanto no middleware `ensureAuthenticatedFamilia`:

- **Aluno com 18 anos ou mais** é responsável por si mesmo: só a própria conta dele (login direto, `senhaPortal` do próprio `Aluno`) acessa o portal a partir daí. Qualquer `Responsavel` vinculado a esse aluno perde o acesso a ele especificamente no exato dia em que ele completa 18 anos — a senha do responsável continua válida, só não abre mais aquele aluno.
- **Aluno menor de 18 anos** só é acessado pelos responsáveis vinculados — o login direto do próprio aluno fica bloqueado mesmo que ele tenha uma credencial válida (`senhaPortal` gerada fica "dormente" até ele fazer 18 anos).
- **A mesma pessoa pode ser, ao mesmo tempo, aluno maior de idade (conta própria) e responsável por outro aluno** (ex.: irmão mais novo) — nesse caso a sessão soma os dois vínculos automaticamente e o seletor de filho no topo mostra os dois. Provar a senha de uma identidade não dá acesso à outra: se as senhas forem diferentes, é preciso logar separadamente com cada uma para ver os dados correspondentes.
- Se a senha bater mas o resultado não der acesso a nenhum aluno (ex.: um responsável cujos filhos já são todos maiores de idade, ou um aluno menor tentando logar direto), o login falha com uma mensagem específica explicando o motivo, em vez de um genérico "senha inválida".

#### Avisos de mensagens não lidas

O chat família↔academia (`MensagemFamilia`) tem um flag `lida` que vira `true` quando o outro lado abre a conversa (ver `ListMensagensFamiliaService`) — isso alimenta indicadores nos dois apps, sem polling agressivo (mesmo intervalo de 60s já usado pelos outros badges):

- **`sgcl-web`**: item **"Mensagens da Família"** no menu (grupo Comunicação) mostra um badge com o total de mensagens da família ainda não lidas na unidade, e leva pra uma tela de inbox (`/mensagens-familia`) — uma linha por aluno com conversa, com prévia da última mensagem e contagem de não lidas, ordenada pela mais recente. Clicar numa linha abre `/alunos/:id?tab=mensagens` já na aba certa.
- **Portal da Família**: os chips do seletor de filho mostram um numerozinho quando aquele aluno tem mensagem nova da academia, e a aba "Mensagens" também ganha esse indicador enquanto não for aberta.

#### Deploy em produção (Netlify, domínio separado)

O Portal da Família é publicado como um **site Netlify próprio** — mesmo repositório, base directory diferente — porque é um app estaticamente separado do `sgcl-web` e não empacota a função serverless do backend (`sgcl-portal-familia/netlify.toml` cuida só do build + fallback de SPA, sem `[functions]`).

1. **Criar o site**: no Netlify, "Add new site" → "Import an existing project" → o mesmo repositório Git do Sys Belt.
2. **Configurar o build**: em "Site settings" → "Build & deploy" → "Build settings", defina:
   - **Base directory**: `sgcl-portal-familia`
   - **Build command**: `npm ci && npm run build` (já vem de `sgcl-portal-familia/netlify.toml`, mas confirme se o Netlify detectou o `netlify.toml` do subdiretório)
   - **Publish directory**: `sgcl-portal-familia/dist` (ou só `dist`, já que é relativo à base directory)
3. **Variável de ambiente obrigatória**: em "Site settings" → "Environment variables", adicione `VITE_API_URL` com a URL **completa e absoluta** do backend (ex.: `https://sysbelt.netlify.app/api`, ou o domínio da API se for diferente). Sem isso o build usa o fallback de desenvolvimento e o portal tenta chamar `/api` no próprio domínio dele, que não existe — toda chamada volta 404.
4. **Liberar CORS no backend**: no site principal (o que roda a API como Netlify Function), edite `CORS_ORIGIN` em "Environment variables" pra incluir a URL de produção do portal, ex.: `CORS_ORIGIN=https://sysbelt.netlify.app,https://portal.suaacademia.com.br`. Redeploy o site principal depois de mudar isso (variável de ambiente só é lida no build/cold start da function).
5. **Apontar o link de login pra produção**: ainda no site principal, defina `VITE_PORTAL_FAMILIA_URL` com a URL de produção do portal (ex.: `https://portal.suaacademia.com.br`) e redeploy o `sgcl-web` — senão o link na tela de login continua apontando pra `localhost:5175`.
6. **Domínio customizado (opcional)**: em "Domain settings" do site do portal, "Add a domain" → configure o CNAME (subdomínio, ex. `portal.suaacademia.com.br`) ou os registros indicados pelo Netlify no seu provedor de DNS. O certificado HTTPS (Let's Encrypt) é emitido automaticamente depois que o DNS propaga.
7. **Deploy e validação**: dispare um deploy (push na branch de produção, ou "Trigger deploy" manual) e confirme: a tela de login do portal carrega, um responsável/aluno com credencial válida consegue logar, e as 5 abas carregam dados reais.

Nenhuma migration nova é necessária pra esse passo — é só configuração de infraestrutura (dois sites Netlify apontando pro mesmo repositório e pro mesmo backend).

#### Deploy da landing page da academia (`landing-academia/`, Netlify, domínio separado)

Site estático (HTML/CSS/JS sem build) pra uma unidade específica captar leads e mostrar equipe/galeria/loja/horários — mesma convenção de site Netlify próprio usada pro Portal da Família, com `landing-academia/netlify.toml` (`publish = "."`, sem função serverless).

1. **Criar o site**: no Netlify, "Add new site" → "Import an existing project" → o mesmo repositório Git.
2. **Configurar o build**: em "Site settings" → "Build & deploy" → "Build settings", defina **Base directory**: `landing-academia` (sem build command — é HTML/CSS/JS estático, `netlify.toml` já cuida do `publish`).
3. **Apontar `script.js` pro backend e pro portal**: edite `landing-academia/script.js` e troque os placeholders `API_BASE_URL` e `PORTAL_FAMILIA_URL` pelas URLs reais de produção (ex.: `https://sysbelt.netlify.app/api` e `https://portal.suaacademia.com.br`), commite e faça o deploy.
4. **Escolher a unidade exibida no site**: no site principal (backend), defina a variável de ambiente `UNIDADE_PUBLICA_ID` com o `id` da unidade (academia) cujos dados (equipe, horários, loja, galeria) esse site deve mostrar — todos os endpoints `/publico/*` são escopados só por essa unidade, sem seletor de tenant. Sem essa variável, os endpoints públicos respondem 503.
5. **Liberar CORS no backend**: ainda no site principal, edite `CORS_ORIGIN` em "Environment variables" pra incluir a URL de produção da landing, ex.: `CORS_ORIGIN=https://sysbelt.netlify.app,https://portal.suaacademia.com.br,https://suaacademia.com.br`. Redeploy o site principal depois de mudar isso.
6. **Conteúdo estático a revisar antes de publicar**: `landing-academia/index.html` tem placeholders visíveis (borda tracejada + "envie o material real") nas fotos das seções "Sobre" e "Localização", depoimentos de exemplo (marcados com comentário `TODO` no HTML) e endereço/telefone fictícios (`Rua Exemplo, 123`, `(11) 99999-9999`, usados tanto no corpo da página quanto no JSON-LD do `<head>`) — troque pelo conteúdo real da academia antes de divulgar o link. Equipe, galeria, loja em destaque, horários e modalidades já vêm dinâmicos da API, não precisam de edição manual.
7. **SEO e analytics**: as meta tags Open Graph no `<head>` já têm título/descrição prontos, mas faltam `og:url` (domínio de produção) e `og:image` (foto real, mínimo 1200×630 — nenhum asset de imagem existe neste repo ainda) — preencha os dois antes de divulgar em redes sociais. Instrumentação de conversão: `script.js` dispara `window.dataLayer.push(...)` (convenção GA4/GTM) e um `CustomEvent` no `document` nos eventos `landing_cta_hero_click` (clique nos dois CTAs do hero) e `landing_lead_enviado` (envio bem-sucedido do formulário) — sem nenhuma conta de analytics conectada ainda, é só plugar o script da plataforma escolhida (GTM, GA4, Plausible etc.) que os eventos já vão fluir sem precisar mexer no código.
8. **Domínio customizado (opcional)** e **deploy e validação**: mesmos passos 6 e 7 do Portal da Família acima — configure o CNAME se quiser um domínio próprio, dispare o deploy e confirme que a página carrega equipe/galeria/loja/horários/modalidades reais e que o formulário de contato envia o lead com sucesso.

A credencial de acesso ao portal é gerada automaticamente pelo backend, direto do cadastro de aluno/responsável — não é um passo manual separado:

- Ao **cadastrar** um aluno ou responsável com e-mail preenchido, o backend já gera uma senha aleatória, salva o hash e devolve a senha em texto puro **uma única vez** na resposta da criação — o `sgcl-web` mostra essa credencial num modal (com botão de copiar) assim que o cadastro é salvo.
- Ao **editar** um aluno/responsável que ainda não tinha e-mail e adicionar um agora, a mesma geração automática acontece — não é preciso nenhuma ação extra.
- Se o aluno/responsável já tem credencial, editar os dados não regenera a senha (evita invalidar um acesso já em uso).
- Pra **redefinir manualmente** (ex.: o responsável esqueceu a senha), continua existindo o botão **"Senha do portal"** na aba Responsáveis do aluno (ou `PATCH /alunos/:id/senha-portal` / `PATCH /responsaveis/:id/senha-portal`, ambos ADMIN-only) — não há fluxo de "esqueci minha senha" self-service nem convite por e-mail nesta primeira versão, **TODO** para a equipe de produto/infra.
- O hash da senha (`senhaPortal`) nunca é devolvido pela API em listagens/detalhes — o Prisma Client tem `omit` configurado por padrão pra esse campo (`src/shared/database/prisma.ts`); só `LoginFamiliaService` lê o hash, e só pra comparar no login.

O botão **"Pagar agora"** dentro do Portal da Família inicia a cobrança pelo gateway de pagamento configurado (`src/modules/pagamentos/gateways`) — como nenhum gateway real está integrado ainda, hoje ele sempre cai no gateway manual (confirmação de pagamento feita à mão pela equipe em Mensalidades). Isso é outro **TODO** explícito: quando um gateway real for habilitado em `FormaPagamento.configuracao`, o botão passa a abrir o checkout de verdade sem precisar mudar nada no frontend.

### Banco de dados

```bash
npx prisma migrate dev     # cria/aplica migrations em desenvolvimento
npx prisma generate        # regenera o Prisma Client
npx prisma migrate deploy  # aplica migrations em produção (não usar migrate dev em prod)
```

#### `DATABASE_URL` pooled vs. `DIRECT_DATABASE_URL` (erro P1002 em produção)

Se `npx prisma migrate deploy` falhar em produção com `Error: P1002` / "Timed out trying to acquire a postgres advisory lock", o motivo normalmente é o `DATABASE_URL` apontar pra uma conexão via pooler (PgBouncer) — no Neon, hostname com `-pooler`. Esse tipo de conexão não preserva sessão entre queries, e a trava usada pelo `migrate deploy` (`pg_advisory_lock`) é de sessão — então ela pode nunca "ver" a própria liberação e travar até o timeout.

A correção é usar uma conexão **direta** (sem pooler) só para o passo de migrations, via a variável `DIRECT_DATABASE_URL` (ver `.env.example`) — o `netlify.toml` já troca `DATABASE_URL` por ela especificamente na chamada de `prisma migrate deploy`, sem afetar o resto do build nem exigir a variável no `prisma generate`:

1. No provedor do banco (ex. Neon → "Connection Details"), copie o connection string **sem** `-pooler` no hostname (mesmo usuário/senha/banco do `DATABASE_URL`).
2. No Netlify, em "Site settings" → "Environment variables" do projeto que roda o backend, adicione `DIRECT_DATABASE_URL` com esse valor, em todos os contextos de deploy.
3. Redeploy. Sem essa variável definida, o build usa `DATABASE_URL` como antes — então não quebra nada enquanto você não configura, só continua sujeito ao mesmo erro intermitente.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, Zod
- **Frontend**: React, TypeScript, Vite, React Router, React Hook Form + Zod, Context API, Axios
- **Deploy**: Netlify (frontend estático + backend como Netlify Function)

## Perfis de acesso

| Perfil | Escopo |
|---|---|
| **SUPERADMIN** | Acesso irrestrito a todas as unidades; único perfil que cadastra unidades/arenas pelo Dashboard, cria outros SUPERADMIN e vincula usuários a múltiplas unidades. |
| **ADMIN** | Gestão completa da(s) própria(s) unidade(s) — pode estar vinculado a mais de uma. |
| **PROFESSOR** | Aulas, chamada, planejamento pedagógico, graduações e competições; dados do Aluno redigidos (sem CPF/endereço/saúde/financeiro); pode dar aula em mais de uma unidade. |
| **RECEPCAO** | Alunos, turmas, aulas, mensalidades, graduações, competições, planos, mensagens e relatórios da própria unidade. |

Além desses quatro perfis "de equipe" (autenticados em `sgcl-web`), existem contas de **RESPONSAVEL** e **ALUNO** — só acessam o Portal da Família (`sgcl-portal-familia`), nunca `sgcl-web`, e enxergam apenas os dados do(s) aluno(s) vinculado(s) à própria conta (resumo, frequência, mensalidades, agenda e mensagens com a academia).

Detalhes completos da matriz de permissões em [`docs/seguranca.md`](docs/seguranca.md) e [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md).

## Documentação

Toda a documentação do projeto está em [`docs/`](docs/), começando por [`docs/README.md`](docs/README.md).

## Licença

Projeto desenvolvido exclusivamente para a Cia de Lutas Weberty Viana. Todos os direitos reservados.
