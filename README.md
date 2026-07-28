# Sys Belt - Sistema Faixa Preta

> Plataforma de gestão multi-unidade para academias de Jiu-Jitsu, unindo administração, financeiro e planejamento pedagógico.

Projeto desenvolvido para a **Cia de Lutas Weberty Viana**.

---

## O que é

O Sys Belt centraliza a gestão de uma ou mais unidades (filiais) de uma academia: alunos, responsáveis, turmas, arenas (tatames/salas), aulas, planejamento pedagógico, graduações, financeiro, competições e relatórios. Cada unidade tem seus dados isolados dos demais — o sistema é multi-tenant desde a base.

## Estrutura do repositório

```
sysbeltfp/
├── src/            # backend (API REST — Express + Prisma + PostgreSQL)
├── sgcl-web/        # frontend (React + TypeScript + Vite)
├── prisma/          # schema.prisma e migrations
├── docs/            # documentação completa do projeto
└── netlify/          # functions usadas no deploy (Netlify)
```

## Como rodar localmente

### Backend

```bash
npm install
npm run dev
```

Servidor em `http://localhost:3333` (configurável via `PORT`). Requer um `.env` com `DATABASE_URL` (PostgreSQL) e `JWT_SECRET` — veja `.env.example`.

### Frontend

```bash
cd sgcl-web
npm install
npm run dev
```

Aplicação em `http://localhost:5173`.

### Banco de dados

```bash
npx prisma migrate dev     # cria/aplica migrations em desenvolvimento
npx prisma generate        # regenera o Prisma Client
npx prisma migrate deploy  # aplica migrations em produção (não usar migrate dev em prod)
```

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

Detalhes completos da matriz de permissões em [`docs/seguranca.md`](docs/seguranca.md) e [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md).

## Documentação

Toda a documentação do projeto está em [`docs/`](docs/), começando por [`docs/README.md`](docs/README.md).

## Licença

Projeto desenvolvido exclusivamente para a Cia de Lutas Weberty Viana. Todos os direitos reservados.
