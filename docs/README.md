# SGCL Kids

> Sistema de Gestão da Cia de Lutas Weberty Viana

---

# Sobre o projeto

O **SGCL Kids (Sistema de Gestão Cia de Lutas Kids)** é uma plataforma desenvolvida para realizar a gestão completa de academias de Jiu-Jitsu Infantil.

O projeto nasceu da necessidade de integrar em um único sistema:

- Gestão de alunos
- Gestão pedagógica
- Controle de aulas
- Evolução técnica
- Avaliação comportamental
- Financeiro
- Competições
- Relatórios

O grande diferencial do SGCL é unir a gestão administrativa com o planejamento pedagógico do Jiu-Jitsu Kids.

---

# Objetivos

O sistema foi desenvolvido para atender três públicos principais.

## Professores

- Abrir aulas
- Fazer chamada
- Avaliar comportamento
- Planejar aulas
- Acompanhar evolução técnica
- Consultar prontuário

---

## Secretaria

- Cadastro de alunos
- Cadastro de responsáveis
- Matrículas
- Financeiro
- Atendimento aos pais

---

## Coordenação

- Dashboard
- Indicadores
- Estatísticas
- Frequência
- Evolução
- Competições
- Relatórios

---

# Principais funcionalidades

## Gestão de alunos

- Cadastro completo
- Foto
- Escola
- Saúde
- Kimono
- Turma
- Responsáveis

---

## Gestão pedagógica

- Currículo
- Técnicas
- Planejamento
- Evolução
- Graduações

---

## Gestão administrativa

- Turmas
- Professores
- Usuários
- Financeiro

---

## Gestão esportiva

- Competições
- Medalhas
- Ranking
- Histórico

---

# Tecnologias

## Backend

- Node.js
- Express
- Prisma ORM
- JWT
- SQLite (desenvolvimento)
- PostgreSQL (produção)

---

## Frontend

- React
- TypeScript
- React Router
- Context API

---

## Ferramentas

- VS Code
- Git
- GitHub
- Thunder Client
- Prisma Studio

---

# Arquitetura

```
Frontend (React)

↓

API REST

↓

Express

↓

Controllers

↓

Services

↓

Prisma

↓

SQLite/PostgreSQL
```

---

# Estrutura do projeto

```
CIadeLutasKids/

│

├── sgcl-api/

├── sgcl-web/

├── docs/

│

└── README.md
```

---

# Backend

```
src/

modules/

shared/

generated/

server.ts
```

---

# Frontend

```
src/

components/

contexts/

modules/

pages/

services/

shared/
```

---

# Como executar

## Backend

```
cd sgcl-api

npm install

npm run dev
```

Servidor:

```
http://localhost:3333
```

---

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

Durante o desenvolvimento é utilizado SQLite.

```
prisma/

schema.prisma

dev.db
```

Para gerar migrações:

```
npx prisma migrate dev
```

Para atualizar o Client:

```
npx prisma generate
```

---

# Autenticação

A autenticação utiliza JWT.

Fluxo:

```
Login

↓

JWT

↓

Middleware

↓

Controller

↓

Service
```

Perfis atualmente disponíveis:

- ADMIN
- PROFESSOR
- RECEPCAO

---

# Organização dos módulos

Atualmente o sistema possui os seguintes módulos.

- Dashboard
- Autenticação
- Usuários
- Alunos
- Responsáveis
- Turmas
- Aulas
- Comportamentos
- Técnicas
- Currículo
- Graduações
- Financeiro
- Competições
- Relatórios

---

# Estado atual do projeto

Versão

```
0.7.0-alpha
```

Situação

```
Desenvolvimento ativo
```

---

# Próximas funcionalidades

- Prontuário completo
- Planejamento da aula
- Evolução técnica
- Dashboard executivo
- Financeiro completo
- WhatsApp
- Relatórios PDF
- Ranking de competições

---

# Documentação

Toda a documentação do projeto encontra-se na pasta:

```
docs/
```

Arquivos principais:

- roadmap.md
- arquitetura.md
- backend.md
- frontend.md
- banco-de-dados.md
- api.md
- regras-de-negocio.md
- modelo-pedagogico.md
- design-system.md
- deploy.md
- seguranca.md
- testes.md

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