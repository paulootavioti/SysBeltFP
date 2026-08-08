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

### Portal do Professor

App **separado** do `sgcl-web`, focado só no momento da aula (mobile-first, coluna única de largura de celular, sem sidebar/bottom tab bar). Diferente do Portal da Família: o professor **já é um `Usuario`** (perfil `PROFESSOR`) — reaproveita o mesmo login do `sgcl-web` (`POST /auth/login`), sem credencial nova. Depois do login, só perfis `PROFESSOR`/`ADMIN`/`SUPERADMIN` entram; qualquer outro perfil recebe uma mensagem explicando pra usar o `sgcl-web`. Consome a mesma API do backend (`/portal-professor/*`, além de reaproveitar `/aulas/programadas/:id/iniciar` e `/uploads` + `/fotos-treino` já existentes).

```bash
cd sgcl-portal-professor
npm install
npm run dev
```

Aplicação em `http://localhost:5176`. O backend já libera CORS pras três origens (`5173`, `5175`, `5176`) por padrão — se mudar a porta, ajuste `CORS_ORIGIN` no `.env` do backend (ver `.env.example`).

A tela Home mostra a próxima aula do dia (ou a de hoje já em andamento, se o professor saiu e voltou), a lista de outras aulas do dia, e atalhos de "Preparação e análise" (Planejamento, Prontuários, Graduações, Minhas turmas) pra uso fora do horário de aula. Esses atalhos abrem telas NATIVAS dentro do próprio Portal — não o `sgcl-web` — consumindo o backend diretamente com o mesmo token já autenticado aqui, sem pedir login de novo e sem trocar de app. "Iniciar aula" entra no Modo Aula: um fluxo linear de 4 etapas (Presença → Plano → Notas → Foto) com cronômetro, sem menu — só avançar/voltar ou pular direto pelo stepper. Ao finalizar, mostra um resumo (presença, técnicas executadas, o que foi registrado) e volta pra Home.

Tocar numa aula já **concluída** na lista de hoje abre um painel flutuante com o que foi registrado nela (presença, técnicas, notas, observação da turma) e as fotos publicadas — e permite enviar uma foto nova mesmo depois da aula finalizada, útil pra quando o professor só consegue mexer no celular depois do treino. A foto entra pelo mesmo caminho da etapa "Foto" do Modo Aula (vai pras famílias dos alunos presentes, e pra galeria pública se marcado).

Robustez pensada pro tatame: o estado da aula (etapa atual + início do cronômetro) fica salvo em `localStorage`, então recarregar a página ou fechar e reabrir a aba retoma exatamente de onde parou — nada se perde. Marcações de presença/técnica/observação que falharem por falta de conexão entram numa fila local e são reenviadas automaticamente assim que a conexão volta (evento `online` do navegador). A tela é mantida acesa durante a aula via Screen Wake Lock API, com degradação silenciosa em navegadores sem suporte.

#### Deploy em produção (Netlify, domínio separado)

Mesma convenção dos outros dois: site Netlify próprio, mesmo repositório, base directory diferente (`sgcl-portal-professor/netlify.toml` cuida do build + fallback de SPA, sem `[functions]`).

1. **Criar o site**: no Netlify, "Add new site" → "Import an existing project" → o mesmo repositório Git do Sys Belt.
2. **Configurar o build**: em "Site settings" → "Build & deploy" → "Build settings": **Base directory** `sgcl-portal-professor`, **Build command** `npm ci && npm run build`, **Publish directory** `dist` (relativo à base directory).
3. **Variáveis de ambiente**: em "Site settings" → "Environment variables", adicione `VITE_API_URL` com a URL completa do backend (ex.: `https://sysbelt.netlify.app/api` — sem isso o build usa o fallback de desenvolvimento e toda chamada volta 404). Os atalhos de "Preparação e análise" são telas nativas deste app e não dependem de nenhuma URL do `sgcl-web`.
4. **Liberar CORS no backend**: no site principal, edite `CORS_ORIGIN` pra incluir a URL de produção deste portal, ex.: `CORS_ORIGIN=https://sysbelt.netlify.app,https://portal.suaacademia.com.br,https://professor.suaacademia.com.br`. Redeploy o site principal depois.
5. **Apontar o link de login pra produção**: ainda no site principal, defina `VITE_PORTAL_PROFESSOR_URL` com a URL de produção deste portal e redeploy o `sgcl-web` — senão o cartão "Portal do Professor" na tela de login continua apontando pra `localhost:5176`.
6. **Domínio customizado (opcional)** e **deploy e validação**: mesmos passos do Portal da Família — configure o CNAME se quiser um domínio próprio, dispare o deploy e confirme que um professor consegue logar, ver a aula do dia e completar o fluxo (presença → plano → notas → foto → finalizar) fim a fim.

Nenhuma migration adicional é necessária pra publicar esse app — já foi aplicada junto com o resto deste patch (`NotaAula`, ver seção Banco de dados).

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

### Banco de testes (leia antes de rodar `npm test`)

A suíte de integração cria e **apaga** registros de verdade. Ela roda contra o banco apontado por `DATABASE_URL`, então rodá-la com o `.env` de produção carregado significa mexer no banco que a academia usa — e basta um filtro escrito errado num teste futuro pra apagar dado real.

Por isso a suíte usa um `.env.test` próprio, com prioridade sobre o `.env`:

```bash
cp .env.test.example .env.test   # ajuste usuário/senha do seu Postgres
npm run test:db:preparar         # cria o banco e aplica as migrations
npm test
```

O `test:db:preparar` roda uma vez só; depois disso `npm test` já usa o banco local sozinho.

**Há uma trava.** Antes de abrir qualquer conexão, o setup confere se o banco é de teste: ou está na própria máquina, ou tem "test"/"teste" no nome (o que cobre o Postgres do CI e um branch de teste do Neon). Se não for, a suíte para com a instrução do que fazer, em vez de tocar no banco.

Se você precisar mesmo rodar contra outro banco — investigar um bug que só acontece em produção, por exemplo — a exceção é explícita:

```bash
PERMITIR_TESTE_EM_BANCO_REAL=1 npm test
```

Além da segurança, faz diferença de tempo: contra um Postgres local a suíte leva cerca de 30 segundos; contra um banco remoto pela internet passa de 8 minutos, porque cada consulta vira uma viagem de rede — e o limite de 5s por teste começa a estourar sozinho.

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

## Rodapé de assinatura

Os três apps React (`sgcl-web`, `sgcl-portal-familia`, `sgcl-portal-professor`) renderizam um rodapé com a assinatura do desenvolvedor e links de redes sociais. Ele é um **componente React** (`SiteFooter`), não markup solto no `index.html` — assim fica dentro do controle do roteador e respeita o layout de cada app.

Aparece em todas as telas, com uma exceção: o **Modo Aula** (`/aula/:id`) do Portal do Professor, que é um fluxo imersivo pensado pro tatame e não deve ter nada além das 4 etapas. A regra vive num único lugar (`sgcl-portal-professor/src/App.tsx`); a tela de resumo (`/aula/:id/resumo`) mantém o rodapé, por já ser a saída desse fluxo.

Na `landing-academia/` (site estático) o rodapé traz o copyright da **academia** em primeiro plano, com a assinatura do desenvolvedor como linha secundária — é o site institucional do cliente, então a marca dele vem primeiro.

O ano do copyright vem de `new Date().getFullYear()` (nos apps React) e do `script.js` via `#anoAtual` (na landing), nunca escrito à mão — senão envelhece sozinho na virada do ano.

## Modalidades

O que a academia ensina — Jiu-Jitsu, Muay Thai, defesa pessoal, projeto social — é uma entidade (`Modalidade`), não um texto digitado em cada tela. Turma e currículo apontam pra ela, então "quais turmas de Muay Thai temos" é uma consulta, não uma busca por string.

Cada modalidade pertence a uma unidade: duas academias podem oferecer "Jiu-Jitsu" com coordenadores e grades diferentes, e o índice único é `(unidade, nome)` — o mesmo nome repetido na mesma unidade é recusado com mensagem clara.

`visivelNaLanding` controla o que aparece no site público. Antes a vitrine era uma lista fixa em código e mudá-la exigia deploy; agora a academia marca a caixa na tela de Modalidades e o card aparece. Modalidade interna (projeto social, turma corporativa) existe no sistema sem ir pro site.

Modalidade não se exclui, se inativa: turmas e currículos antigos continuam apontando pra ela e o histórico fica de pé. Inativar é bloqueado enquanto houver turma ativa — quase sempre isso é engano, e o erro diz quantas turmas faltam mover.

## Pagamento por PIX (Mercado Pago)

A cobrança PIX do Portal da Família é gerada pelo Mercado Pago. A escolha do gateway continua sendo por forma de pagamento (`FormaPagamento.configuracao.gateway = "MERCADO_PAGO"`); sem isso a forma segue no fluxo manual, confirmada pela recepção como sempre foi.

Configuração: `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` (ver `.env.example`). No painel do Mercado Pago, cadastre a URL `https://SEU-BACKEND/pagamentos/webhook/mercado_pago` no evento "Pagamentos".

### Por que o webhook é a parte delicada

O webhook não carrega o JWT da aplicação — se ele aceitasse qualquer chamada, quem descobrisse a URL daria baixa numa mensalidade sem pagar. Três defesas, nesta ordem:

1. **Assinatura HMAC-SHA256.** O cabeçalho `x-signature` é conferido contra um manifesto montado com o id do recurso, o `x-request-id` e o timestamp, comparado em tempo constante. Sem `MERCADO_PAGO_WEBHOOK_SECRET` configurado, **nada é aceito** — falha fechado, não aberto.
2. **Janela de tolerância.** Assinatura com mais de 10 minutos é recusada, senão um payload capturado valeria pra sempre.
3. **O payload não é fonte de verdade.** Recebida a notificação, o sistema relê o pagamento na API do Mercado Pago e decide pelo status de lá. A notificação diz apenas *que* algo mudou.

### Reenvio não é erro

Todo gateway reenvia a notificação enquanto não recebe 200. Cada evento é gravado em `EventoWebhookPagamento` com índice único `(gateway, eventoExternoId)` **antes** de qualquer efeito — a reserva da chave é o que impede dois webhooks simultâneos de darem baixa duas vezes. Repetição responde 200 com `JA_PROCESSADO`.

O payload cru fica guardado: serve de prova em conciliação e permite reprocessar sem depender de o gateway reenviar.

Pagamento que chega para mensalidade **cancelada ou estornada** não reabre a cobrança sozinho — fica registrado como pendente de tratamento manual, porque devolver dinheiro é decisão de gente.

**A recorrência automática ainda não está integrada.** No Mercado Pago ela é outra API (preapproval), com fluxo de autorização próprio; `criarAssinatura` falha de forma explícita em vez de fingir que funcionou. A mensalidade continua sendo gerada pelo sistema e cobrada via PIX avulso.

## Auditoria e consentimento (LGPD)

Toda operação sensível grava **quem fez, o que mudou e de onde partiu** — IP e dispositivo inclusive. Esses dois campos não são passados de service em service: um `AsyncLocalStorage` guarda o contexto no início da requisição (`shared/context/contextoRequisicao.ts`) e o `AuditLogService` o lê. Isso significa que nenhuma assinatura de função precisou mudar e ninguém tem como esquecer de repassar. Fora de uma requisição (cron, script) os campos ficam nulos em vez de quebrar.

A auditoria cobre alteração e também **leitura**: abrir o prontuário completo de um aluno — que traz saúde, documento e financeiro — grava um registro `CONSULTA_SENSIVEL`. Sem isso não há como investigar acesso indevido depois, já que consultar não deixa marca no dado.

Atrás de proxy o IP real vem no `X-Forwarded-For`; o app usa `trust proxy` e pega o primeiro da cadeia, senão a auditoria registraria o endereço do proxy pra todo mundo.

### Consentimento

`Consentimento` é um livro de registro, não um booleano: guarda o tipo (uso de imagem, biometria, dados de saúde, comunicações), quem consentiu — **o responsável, quando o aluno é menor**, como a LGPD exige (art. 14, §1º) —, quem registrou, quando, de onde e **a versão da política aceita**. Sem a versão não dá pra saber a que a pessoa consentiu depois que o texto mudar.

Consentimento não se apaga, se revoga (art. 8º, §5º): a linha permanece com `revogadoEm` preenchido, porque a revogação também é um fato a registrar.

`Aluno.autorizaUsoImagem` continua existindo como projeção do estado atual, lida no caminho quente da publicação de fotos — mas só é escrita pelo serviço de consentimento, inclusive quando a caixa é marcada na tela do aluno. É isso que impede o booleano e o histórico de divergirem.

**Biometria é bloqueada sem consentimento.** Cadastrar credencial `FACIAL` ou `BIOMETRIA` para um aluno exige consentimento específico vigente, senão a API recusa com 403. Cartão, QR Code e PIN não passam por essa exigência — não são biometria.

Os consentimentos criados pela migration têm versão `migracao-inicial`: vieram do booleano antigo e **não valem como evidência de coleta** — não há registro de quem respondeu nem a que texto. `temConsentimentoValido` os trata como inválidos de propósito, então a academia precisa recoletar antes de ligar reconhecimento facial.

## Controle de acesso (catraca)

Módulo agnóstico de fabricante: o Sys Belt é dono do **cadastro e das regras** (quem entra, com matrícula ativa e mensalidade em dia); o equipamento é dono do **reconhecimento** (facial, biometria, cartão, QR, PIN). Nenhuma regra de negócio conhece marca de catraca — a escolha do fabricante é o campo `DispositivoAcesso.provedor`, resolvido em `src/modules/controleAcesso/providers`, no mesmo padrão já usado em pagamentos e assinatura eletrônica.

Isso cobre os dois modelos de mercado sem mudar as regras:

- **Equipamento que decide localmente** (Control iD, Henry, Intelbras, Hikvision, ZKTeco, Toletus, Madis): guarda os templates e libera sozinho; o sistema sincroniza as pessoas e recebe os eventos em `POST /controle-acesso/dispositivos/:id/eventos`.
- **Equipamento que consulta o servidor** a cada passagem: chama `POST /controle-acesso/dispositivos/:id/autorizar` e o motor de regras responde na hora.

A catraca não faz login: identifica-se pelo id do dispositivo mais o header `x-dispositivo-segredo`, definido no cadastro (comparação em tempo constante).

**Nenhuma integração real de fabricante existe ainda** — todos os providers nomeados herdam de `StubAccessControlProvider` e falham de forma explícita (`ProvedorAcessoNaoImplementadoError`) em vez de fingir sucesso. Sem provedor configurado, o sistema usa o provider manual: a recepção libera e o evento fica registrado igual. Para integrar um fabricante, crie a classe herdando do stub, implemente os métodos que aquele equipamento suporta e registre em `providers/index.ts`.

O motor de regras (`AutorizarAcessoService`) nega por: credencial inexistente/revogada/expirada, matrícula inativa e mensalidade vencida. **Saída é sempre liberada** — ninguém fica preso lá dentro. Toda passagem (autorizada ou não) vira um `EventoAcesso` com o payload cru do fabricante, servindo de trilha de auditoria.

### Antes de ligar reconhecimento facial

A foto de perfil que já existe **não serve** como base de reconhecimento: é enquadramento livre, sem captura controlada nem prova de vivacidade. Ela pode ser o ponto de partida do cadastro no equipamento, não a base da comparação.

Dado biométrico é **dado pessoal sensível** (LGPD, art. 5º, II) — o módulo de consentimento acima já bloqueia o cadastro biométrico sem autorização vigente. Exige consentimento específico e destacado, finalidade declarada e política de retenção — com atenção redobrada aos alunos menores de idade. O `Aluno.autorizaUsoImagem` de hoje cobre foto de divulgação, **não** biometria; um consentimento próprio precisa ser adicionado antes de habilitar o cadastro facial. Por isso o template biométrico não é guardado no banco: fica no equipamento, e o sistema só referencia o id dele (`CredencialAcesso.provedorPessoaId`).

## Fotos servidas por URL assinada

As imagens ficam atrás de `GET /uploads/:prefixo/:arquivo`. Um `<img>` nunca envia header `Authorization`, então exigir autenticação ali fazia toda foto exibida com `<img>` voltar 401 (era por isso que a foto do treino não aparecia). A rota agora aceita **URL assinada** (`?exp=&sig=`, HMAC sobre chave+expiração, validade de 6h) ou o header, o que mantém funcionando quem busca a imagem via axios (`AuthenticatedImage` no sgcl-web). Os services devolvem a url já assinada; nos frontends, `resolverUrlUpload` prefixa a base da API, necessário porque os portais rodam em outro domínio.

## Documentação

Toda a documentação do projeto está em [`docs/`](docs/), começando por [`docs/README.md`](docs/README.md).

## Licença

Projeto desenvolvido exclusivamente para a Cia de Lutas Weberty Viana. Todos os direitos reservados.
