# Sys Belt - Sistema Faixa Preta

> Sistema de Gestão da Cia de Lutas Weberty Viana

---

# Sobre o projeto

O **Sys Belt - Sistema Faixa Preta** é uma plataforma multi-unidade (multi-tenant) desenvolvida para realizar a gestão completa de academias de Jiu-Jitsu.

O projeto integra em um único sistema:

- Gestão de unidades e arenas (tatames/salas)
- Gestão de alunos e responsáveis
- Gestão pedagógica (currículo, planejamento, evolução técnica)
- Controle de turmas, aulas e programação de aulas
- Avaliação comportamental
- Financeiro (mensalidades, planos)
- Competições
- Mensagens/avisos automáticos
- Relatórios
- Dashboard executivo

O grande diferencial do Sys Belt é unir a gestão administrativa multi-unidade com o planejamento pedagógico do Jiu-Jitsu Kids, com controle de acesso granular por perfil.

---

# Objetivos

O sistema atende quatro públicos principais.

## Superadmin

- Cadastra e administra todas as unidades e arenas
- Enxerga e opera qualquer unidade ("visualizar como")
- Cria outros usuários Superadmin
- Vincula usuários (Admin, Professor, Recepção) a uma ou mais unidades

## Professores

- Abrir aulas, fazer chamada, avaliar comportamento
- Planejar aulas e acompanhar evolução técnica
- Consultar (visão redigida) dados dos próprios alunos
- Registrar graduações e competições
- Transferir uma aula programada para outro professor, com justificativa
- Consultar (somente leitura) a grade horária de outras unidades

## Secretaria (Recepção)

- Cadastro de alunos, responsáveis e turmas
- Matrículas, financeiro e planos
- Atendimento aos pais, mensagens automáticas

## Administração (Admin/Coordenação)

- Dashboard, indicadores e relatórios da própria unidade
- Gestão de arenas, turmas, usuários e financeiro
- Frequência, evolução e competições

---

# Principais funcionalidades

## Gestão multi-unidade

- Cadastro de unidades (filiais) e arenas — isolamento de dados por unidade
- Superadmin pode "visualizar como" qualquer unidade ou todas ao mesmo tempo
- Usuários (Admin, Professor, Recepção) podem ser vinculados a mais de uma unidade, com um seletor de "unidade ativa"

## Gestão de alunos

- Cadastro completo (dados pessoais, escola, saúde, kimono, foto)
- Turma e responsáveis
- Visão de dados redigida para o perfil Professor (só nome, apelido, responsável, turma, presenças e graduações)

## Gestão pedagógica

- Currículo, módulos, técnicas e planos de aula
- Planejamento e evolução por presenças
- Graduações (trilha Infantil e trilha Juvenil/Adulta)

## Gestão de turmas e aulas

- Turmas vinculadas a arena, professor e currículo
- Programação prévia de aulas (grade semanal/mensal)
- Transferência de aula para outro professor, com motivo obrigatório e checagem de conflito de horário

## Gestão administrativa

- Turmas, professores, usuários
- Financeiro (mensalidades, planos)

## Gestão esportiva

- Competições, inscrição de atletas, resultados

---

# Tecnologias

## Backend

- Node.js
- Express
- Prisma ORM
- JWT
- PostgreSQL

## Frontend

- React
- TypeScript
- Vite
- React Router
- React Hook Form + Zod
- Context API

## Ferramentas

- VS Code
- Git / GitHub
- Prisma Studio
- Vitest (testes)
- Playwright (verificação manual de UI)

---

# Arquitetura

```
Frontend (React)
        │
        ▼
   API REST (Axios)
        │
        ▼
     Express
        │
        ▼
  Controllers → Services → Prisma
        │
        ▼
     PostgreSQL
```

Detalhes completos em [`arquitetura.md`](arquitetura.md).

---

# Estrutura do projeto

```
sysbeltfp/
│
├── src/            (backend — sgcl-api)
├── sgcl-web/        (frontend)
├── prisma/          (schema.prisma + migrations)
├── docs/
└── README.md
```

---

# Backend

```
src/
  modules/    (21 módulos de domínio — ver lista abaixo)
  shared/     (database, middlewares, errors, constants, utils)
  @types/
  app.ts
  server.ts
```

---

# Frontend

```
sgcl-web/src/
  components/  (layout/ e ui/ — Design System)
  contexts/
  modules/
  pages/
  routes/
  services/
  shared/
```

---

# Como executar

## Backend

```
npm install
npm run dev
```

Servidor:

```
http://localhost:3333
```

## Frontend

```
cd sgcl-web
npm install
npm run dev
```

Aplicação:

```
http://localhost:5173
```

---

# Banco de dados

O sistema utiliza **PostgreSQL** em todos os ambientes (desenvolvimento e produção) — não há mais uso de SQLite.

```
prisma/
  schema.prisma
  migrations/
```

Para gerar e aplicar uma migração em desenvolvimento:

```
npx prisma migrate dev
```

Para aplicar migrações já criadas (produção):

```
npx prisma migrate deploy
```

Para atualizar o Client:

```
npx prisma generate
```

---

# Autenticação e perfis

A autenticação utiliza JWT. Fluxo:

```
Login → JWT → Authorization Bearer → Middleware (ensureAuthenticated) → ensureRole → Controller → Service
```

Perfis disponíveis:

- **SUPERADMIN** — acesso irrestrito a todas as unidades; bypassa qualquer checagem de `ensureRole`.
- **ADMIN** — gestão completa da(s) própria(s) unidade(s).
- **PROFESSOR** — pedagógico, aulas, graduações, competições; dados de aluno redigidos.
- **RECEPCAO** — cadastros, financeiro, mensalidades, mensagens.

Um usuário Admin, Professor ou Recepção pode estar vinculado a mais de uma unidade (tabela `UsuarioUnidade`) — nesse caso, escolhe qual unidade está "ativa" através de um seletor no cabeçalho, e um Superadmin pode "visualizar como" qualquer unidade específica ou todas juntas.

Matriz completa de permissões por perfil e módulo: [`seguranca.md`](seguranca.md) e [`regras-de-negocio.md`](regras-de-negocio.md).

---

# Organização dos módulos

Módulos atuais do backend (`src/modules/`):

- `unidades`, `arenas` — multi-tenant
- `auth`, `usuarios` — autenticação e gestão de usuários
- `alunos`, `responsaveis`
- `turmas`, `aulas`
- `curriculos`, `tecnicas`, `comportamentos`
- `graduacoes`
- `mensalidades`, `planos`, `financeiro`
- `competicoes`
- `avisos`, `mensagens`
- `relatorios`, `dashboard`
- `uploads`

O frontend espelha a maior parte desses módulos em `sgcl-web/src/modules/`.

---

# Estado atual do projeto

Situação

```
Desenvolvimento ativo — multi-unidade (multi-tenant) em produção
```

O sistema já opera com múltiplas unidades isoladas, controle de acesso granular por perfil e usuários vinculados a mais de uma unidade — capacidades que antes eram tratadas como visão de longo prazo (SaaS) e hoje já são realidade.

---

# Próximas funcionalidades

- Evolução técnica avançada
- Financeiro completo (PIX)
- WhatsApp
- Relatórios em PDF/Excel
- Ranking, medalhas e estatísticas de competições
- Certificados automáticos de graduação

Ver [`roadmap.md`](roadmap.md) para o planejamento completo.

---

# Documentação

Toda a documentação do projeto encontra-se na pasta `docs/`.

Arquivos principais:

- [`roadmap.md`](roadmap.md) — planejamento estratégico
- [`arquitetura.md`](arquitetura.md) — arquitetura geral
- [`backend.md`](backend.md) — convenções do backend
- [`frontend.md`](frontend.md) — convenções do frontend
- [`banco-de-dados.md`](banco-de-dados.md) — modelo de dados completo
- [`api.md`](api.md) — endpoints da API
- [`regras-de-negocio.md`](regras-de-negocio.md) — regras de negócio (RN)
- [`seguranca.md`](seguranca.md) — segurança e controle de acesso
- [`modelo-pedagogico.md`](modelo-pedagogico.md) — modelo pedagógico
- [`design-system.md`](design-system.md) — design system do frontend
- [`deploy.md`](deploy.md) — processo de deploy
- [`testes.md`](testes.md) — estratégia de testes
- [`changelog.md`](changelog.md) — histórico de versões
- [`architecture-decisions.md`](architecture-decisions.md) — ADRs
- [`coding-standards.md`](coding-standards.md) — padrões de código (backend e frontend)
- [`product-vision.md`](product-vision.md) — visão de produto

---

# Licença

Projeto desenvolvido exclusivamente para a **Cia de Lutas Weberty Viana**.

Todos os direitos reservados.

---

# Autor

Projeto idealizado e desenvolvido por

**Paulo Otávio**

Analista de Sistemas

Full Stack Developer

Brasília – DF

Brasil
