# Sys Belt

> Plataforma SaaS de gestão para academias de artes marciais

---

# Sobre o projeto

O **Sys Belt** é uma plataforma de gestão para academias de Jiu-Jitsu,
vendida por assinatura mensal e cobrada por faixa de alunos.

Cada academia assinante opera sobre um **banco de dados exclusivo**. O
isolamento entre clientes é físico: não há tabela compartilhada, não há coluna
discriminadora separando academias dentro do mesmo banco, e nenhuma consulta
do sistema operacional alcança dados de outro assinante.

Dentro de uma mesma academia, as unidades (filiais) compartilham dados entre
si — um aluno pode treinar em mais de uma unidade da mesma rede.

O diferencial do produto é unir a gestão administrativa multi-unidade com o
planejamento pedagógico do Jiu-Jitsu Kids, com controle de acesso por perfil.

---

# Os dois planos

O sistema é dividido em dois planos com bancos separados.

| | Control Plane | Tenant Plane |
|---|---|---|
| Código | `control-plane/` | `src/` |
| Quem usa | Operador do SaaS | A academia assinante |
| Banco | Um, exclusivo do SysBelt | Um por academia |
| Guarda | Assinantes, planos, assinaturas, faturas, licenças, provisionamento, auditoria | Alunos, turmas, aulas, financeiro da academia |
| Módulos | 14 | 44 |
| Testes | 188 | 663 |
| Frontend | `control-plane/web` — painel do operador | `sgcl-web` e os dois portais |
| Publicado em | `sysbelt-control-plane.netlify.app` | `sysbeltfp.netlify.app` |

O Tenant Plane **não conhece** preço, fatura nem qualquer outro assinante. O
que ele sabe sobre a própria assinatura chega por uma **concessão assinada**
(Ed25519): o Control Plane assina uma projeção com os recursos contratados e o
Tenant Plane verifica a assinatura localmente, sem consulta cruzada entre
bancos em tempo de requisição.

Documentos de referência:

- [`architecture-decisions.md`](architecture-decisions.md) — ADRs, com destaque
  para a ADR-010 (banco exclusivo por academia);
- [`control-plane-b2b.md`](control-plane-b2b.md) — modelo funcional e de dados
  do sistema comercial;
- [`resolucao-tenant.md`](resolucao-tenant.md) — identificação por hostname,
  contexto por requisição e seleção segura do banco;
- [`operacao-bancos-exclusivos.md`](operacao-bancos-exclusivos.md) —
  provisionamento, segredos, migrations, backup, rotação e encerramento;
- [`mapa-extracao-control-plane.md`](mapa-extracao-control-plane.md) — destino
  de cada tabela, rota, serviço e tela na separação dos planos.

---

# Modelo comercial

Cobrança **por unidade**, em faixas de alunos:

- cada faixa cobre até 10 alunos e custa R$ 37,00;
- o valor da conta é a soma das faixas de cada unidade, mínimo de uma faixa
  por unidade ativa;
- aluno lotado em mais de uma unidade conta **uma vez em cada unidade**.

Duas unidades com 12 e 8 alunos: `2 + 1 = 3 faixas = R$ 111,00`.

O cálculo está em `src/modules/plataforma/utils/precoPlataforma.ts`, é puro
(não lê banco nem relógio) e opera em centavos com aritmética inteira.

---

# Públicos e perfis

Existem quatro perfis, todos dentro da academia. O operador do SaaS **não é um
perfil do Tenant Plane** — ele trabalha no Control Plane, com autenticação
própria.

## DONO

O dono da academia cliente. Alcança todas as filiais da própria conta e
nenhuma de outra. Gerencia unidades, vincula usuários a unidades e vê a
própria assinatura em `GET /plataforma/minha-assinatura`.

Onde um `ADMIN` passa, o `DONO` passa — a herança é declarada uma única vez em
`PERFIS_QUE_HERDAM` (`src/shared/constants/perfis.ts`), para que nenhuma rota
precise lembrar de listar os dois.

## ADMIN

Gestão completa da(s) própria(s) unidade(s): dashboard, indicadores,
relatórios, arenas, turmas, usuários e financeiro.

## PROFESSOR

Abre aulas, faz chamada, avalia comportamento, planeja aulas e acompanha
evolução técnica. Registra graduações e competições. Vê dados de aluno em
**visão redigida** — apenas nome, apelido, responsável, turma, presenças e
graduações. Pode consultar, somente leitura, a grade de outras unidades.

## RECEPCAO

Cadastro de alunos, responsáveis e turmas; matrículas, financeiro, planos,
atendimento e mensagens.

> **Perfil legado:** `SUPERADMIN` não existe mais. Usuários com esse perfil em
> bancos antigos são recusados no login e em toda requisição autenticada
> (`src/shared/security/superadminLegado.ts`), com orientação para usar o
> Control Plane. A guarda é intencional e não deve ser removida enquanto
> existirem bancos anteriores à separação dos planos.

Matriz completa: [`seguranca.md`](seguranca.md) e
[`regras-de-negocio.md`](regras-de-negocio.md).

---

# Principais funcionalidades

- **Unidades e arenas** — filiais e tatames/salas, com escopo por unidade e
  seletor de unidade ativa para quem tem mais de um vínculo.
- **Alunos** — cadastro completo (dados pessoais, escola, saúde, kimono,
  foto), turma, responsáveis, lotação em mais de uma unidade.
- **Pedagógico** — currículo, módulos, técnicas, planos de aula,
  planejamento, prontuário, evolução por presenças.
- **Graduações** — trilha Infantil (até Verde) e Juvenil/Adulta (Branca a
  Preta), com idade mínima e tempo de permanência.
- **Turmas e aulas** — grade semanal/mensal, programação prévia,
  transferência de aula com motivo obrigatório e checagem de conflito.
- **Comportamentos** — respeito, valentia, esforço, atenção, disciplina.
- **Financeiro** — mensalidades, planos, recebimentos, caixa, inadimplência.
- **Pagamentos** — gateway com credenciais próprias de cada assinante,
  cifradas em repouso (AES-256-GCM).
- **Contratos** — modelos, geração e assinatura eletrônica.
- **Competições** — inscrição de atletas e registro de resultados.
- **Comunicação** — avisos, mensagens, notificações e WhatsApp (liberado por
  concessão).
- **Controle de acesso** — reconhecimento facial, dependente de consentimento
  válido.
- **Loja, eventos, metas, fotos de treino, leads.**
- **Relatórios e dashboard.**

---

# Tecnologias

**Backend** — Node.js, Express 5, Prisma ORM, PostgreSQL, JWT, Zod

**Frontend** — React, TypeScript, Vite, React Router, React Hook Form + Zod,
Context API

**Infraestrutura** — Netlify (functions serverless), Neon (PostgreSQL
gerenciado), AWS Secrets Manager (cofre dos segredos de tenant)

**Qualidade** — Vitest, Supertest, GitHub Actions, Playwright (verificação
manual de UI)

---

# Estrutura do repositório

```
sysbeltfp/
├── src/                      # Tenant Plane — API REST (44 módulos)
├── control-plane/            # Control Plane — sistema comercial B2B
│   └── web/                  # painel do operador (servido pelo mesmo site)
├── contracts/                # contratos versionados entre os planos
├── sgcl-web/                 # frontend da equipe da academia
├── sgcl-portal-familia/      # Portal da Família
├── sgcl-portal-professor/    # Portal do Professor
├── landing/                  # site institucional do SysBelt
├── landing-academia/         # site institucional da academia
├── prisma/                   # schema.prisma + 34 migrations
├── netlify/                  # functions do Tenant Plane
├── scripts/                  # preflight, auditoria e preparo do banco de teste
└── docs/                     # esta documentação
```

---

# Módulos do backend

`src/modules/` — 44 módulos:

- **Estrutura** — `unidades`, `arenas`, `modalidades`
- **Acesso** — `auth`, `usuarios`, `controleAcesso`, `consentimentos`
- **Pessoas** — `alunos`, `responsaveis`, `leads`
- **Ensino** — `turmas`, `aulas`, `curriculos`, `tecnicas`, `comportamentos`,
  `graduacoes`, `metas`
- **Financeiro** — `mensalidades`, `planos`, `financeiro`, `pagamentos`,
  `formasPagamento`, `assinaturas`, `loja`
- **Documentos** — `contratos`, `modelosContrato`, `assinaturaEletronica`
- **Comunicação** — `avisos`, `mensagens`, `mensagensFamilia`, `notificacoes`,
  `whatsapp`
- **Portais** — `portalFamilia`, `portalProfessor`, `publico`
- **Esportivo** — `competicoes`, `eventos`, `fotosTreino`
- **Análise** — `relatorios`, `dashboard`
- **Plataforma** — `plataforma` (somente leitura da própria assinatura),
  `concessaoPlataforma`, `integracaoControlPlane`
- **Apoio** — `uploads`

`src/shared/` — `constants`, `context`, `database`, `errors`, `middlewares`,
`security`, `services`, `tenant`, `testing`, `utils`.

---

# Como executar

## Backend (Tenant Plane)

```bash
npm install
npm run dev
```

`http://localhost:3333`. Requer `.env` com `DATABASE_URL`, `JWT_SECRET` e
`CHAVE_SEGREDOS` — ver `.env.example`.

## Control Plane

```bash
cd control-plane
npm install
npm run dev            # API na porta 3334

cd web
npm install
npm run dev            # painel do operador na porta 5177
```

Requer `control-plane/.env` — ver `control-plane/.env.example`. O painel
encaminha `/api` para a API local, reproduzindo o arranjo de produção, onde os
dois são servidos pelo mesmo site.

Para criar o primeiro operador:

```bash
cd control-plane
CONTROL_PLANE_ADMIN_NAME="..." CONTROL_PLANE_ADMIN_EMAIL="..." \
CONTROL_PLANE_ADMIN_PASSWORD="..." npm run seed:operator
```

> Rodando local, as rotas ficam na raiz. O prefixo `/api` de produção vem do
> wrapper serverless (`netlify/functions/api.ts`), não do Express.

## Frontends

```bash
cd sgcl-web && npm install && npm run dev              # 5173
cd sgcl-portal-familia && npm install && npm run dev   # 5175
cd sgcl-portal-professor && npm install && npm run dev # 5176
```

O backend já libera CORS para as três origens; para mudar, ajuste
`CORS_ORIGIN`.

---

# Banco de dados

PostgreSQL em todos os ambientes.

```bash
npx prisma migrate dev      # criar e aplicar migração (desenvolvimento)
npx prisma migrate deploy   # aplicar migrações existentes (produção)
npx prisma generate         # regenerar o Client
```

> **Sempre rode `npx prisma generate` após mudar o schema ou trocar de
> branch.** Um Client desatualizado produz erros de tipo em massa que
> descrevem propriedades inexistentes — falhas fantasma que não correspondem a
> nenhum defeito real do código.

Antes de `migrate deploy` em produção: **faça backup**. Migrações deste projeto
já removeram colunas e tornaram `Unidade.contaId` `NOT NULL`.

Modelo completo: [`banco-de-dados.md`](banco-de-dados.md).

---

# Testes

```bash
npm run test:db:preparar    # uma vez, cria o banco da suíte
npm test                            # 663 testes do Tenant Plane
cd control-plane && npm test        # 188 testes do Control Plane
cd control-plane/web && npm test    #  50 testes do painel do operador
cd sgcl-web && npm test             #  72 testes do frontend da equipe
cd sgcl-portal-familia && npm test  #  42 testes
cd sgcl-portal-professor && npm test #  49 testes
```

A suíte **apaga registros** e recusa rodar contra qualquer banco que não se
identifique como de teste. Estratégia completa: [`testes.md`](testes.md).

---

# Estado atual

```
1.0.0-rc — Tenant Plane em produção com uma academia real.
Control Plane publicado, com painel de operador, aguardando o primeiro
assinante provisionado.
Resolução de tenant implementada e desligada por flag.
```

Publicação do Control Plane pelo GitHub Actions
(`.github/workflows/deploy-control-plane.yml`): roda a suíte, compila e envia
o artefato pronto. Migrations continuam manuais — ver [`deploy.md`](deploy.md).

Planejamento e próximos passos: [`roadmap.md`](roadmap.md).

---

# Documentação

| Arquivo | Conteúdo |
|---|---|
| [`roadmap.md`](roadmap.md) | Estado atual e próximos passos |
| [`arquitetura.md`](arquitetura.md) | Arquitetura geral e camadas |
| [`architecture-decisions.md`](architecture-decisions.md) | ADRs |
| [`control-plane-b2b.md`](control-plane-b2b.md) | Sistema comercial B2B |
| [`resolucao-tenant.md`](resolucao-tenant.md) | Resolução por hostname e contexto |
| [`operacao-bancos-exclusivos.md`](operacao-bancos-exclusivos.md) | Operação dos bancos por academia |
| [`mapa-extracao-control-plane.md`](mapa-extracao-control-plane.md) | Mapa da separação dos planos |
| [`backend.md`](backend.md) | Convenções do backend |
| [`frontend.md`](frontend.md) | Convenções do frontend |
| [`banco-de-dados.md`](banco-de-dados.md) | Modelo de dados |
| [`api.md`](api.md) | Endpoints |
| [`regras-de-negocio.md`](regras-de-negocio.md) | Regras de negócio (RN) |
| [`seguranca.md`](seguranca.md) | Segurança e controle de acesso |
| [`modelo-pedagogico.md`](modelo-pedagogico.md) | Modelo pedagógico |
| [`ux-padrao.md`](ux-padrao.md) | Padrão de UX/UI |
| [`deploy.md`](deploy.md) | Deploy |
| [`testes.md`](testes.md) | Estratégia de testes |
| [`coding-standards.md`](coding-standards.md) | Padrões de código |
| [`changelog.md`](changelog.md) | Histórico |

---

# Autor

**Paulo Otávio** — Analista de Sistemas, Full Stack Developer
Brasília – DF, Brasil

Todos os direitos reservados.
