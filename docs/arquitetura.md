# Arquitetura do Sistema

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Visão Geral

O SGCL Kids (Sistema de Gestão da Cia de Lutas) foi desenvolvido utilizando arquitetura em camadas, separando claramente responsabilidades entre frontend, backend, banco de dados e regras de negócio.

O objetivo principal dessa arquitetura é garantir:

- Escalabilidade
- Facilidade de manutenção
- Reutilização de código
- Baixo acoplamento
- Alta coesão
- Facilidade de testes

---

# Arquitetura Geral

                    Usuário
                        │
                        ▼
              React + TypeScript
                        │
                  API REST (HTTP)
                        │
                        ▼
               Express (Node.js)
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Controllers       Middlewares     Auth
        │
        ▼
     Services
        │
        ▼
      Prisma ORM
        │
        ▼
 SQLite (Desenvolvimento)
 PostgreSQL (Produção)

---

# Tecnologias

## Frontend

- React
- TypeScript
- React Router
- React Hook Form
- Context API
- Axios
- CSS Modules (Design System próprio)

---

## Backend

- Node.js
- Express
- Prisma ORM
- JWT
- Bcrypt
- Zod

---

## Banco de Dados

Desenvolvimento

SQLite

Produção

PostgreSQL

---

# Organização do Backend

```
src/

modules/

shared/

generated/

server.ts
```

---

# Estrutura dos módulos

Cada módulo possui estrutura independente.

Exemplo:

```
modules/

alunos/

controller.ts

routes.ts

services/

types/

schema/
```

Isso permite que cada domínio da aplicação seja isolado.

---

# Camadas

## Controller

Responsável por:

- receber requisições
- validar parâmetros básicos
- chamar services
- devolver respostas HTTP

Nunca contém regra de negócio.

---

## Service

Toda regra de negócio fica aqui.

Exemplos:

CreateAlunoService

UpdateAlunoService

StartAulaService

FinalizarAulaService

---

## Prisma

Responsável apenas pelo acesso aos dados.

Nenhuma regra de negócio fica no Prisma.

---

# Shared

A pasta shared concentra funcionalidades comuns.

```
shared/

database/

middlewares/

errors/

constants/
```

---

# Database

```
shared/database/prisma.ts
```

Instância única do Prisma Client.

---

# Errors

```
AppError
```

Todas as exceções controladas utilizam AppError.

---

# Middlewares

Atualmente existem:

ensureAuthenticated

ensureRole

errorHandler

---

# Fluxo de uma requisição

Exemplo:

GET /alunos

↓

Router

↓

Middleware JWT

↓

Controller

↓

Service

↓

Prisma

↓

Banco

↓

JSON

---

# Organização do Frontend

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

# Componentes

Existem dois grupos.

## Componentes Genéricos

Button

Input

Loading

Modal

PageHeader

etc.

---

## Design System SGCL

Page

Section

InfoCard

StatusBadge

Cards

Layouts

---

# Organização dos módulos do Frontend

Cada módulo possui:

```
components/

pages/

services/

types/

schema/

mappers/

utils/
```

---

# Comunicação Frontend → Backend

Toda comunicação é realizada por API REST.

Utiliza Axios.

```
ApiClient

↓

JWT

↓

Express
```

---

# Autenticação

Fluxo

Login

↓

JWT

↓

LocalStorage

↓

Authorization Bearer

↓

Middleware

↓

Controller

---

# Controle de Perfis

Perfis atualmente disponíveis.

ADMIN

PROFESSOR

RECEPCAO

Cada rota define quais perfis possuem acesso.

---

# Banco de Dados

Utiliza Prisma ORM.

Principais entidades.

Aluno

Responsável

Turma

Aula

AulaAluno

Usuário

Mensalidade

Competição

Currículo

Técnica

Graduação

---

# Relacionamentos

Turma

↓

Aluno

↓

Responsáveis

↓

Aulas

↓

Comportamentos

↓

Graduações

↓

Competições

↓

Mensalidades

---

# Evolução do Sistema

O projeto passou por uma mudança arquitetural importante.

Modelo antigo

Aluno

↓

Presença

Modelo atual

Turma

↓

Aula

↓

AulaAluno

Isso tornou possível registrar:

- presença
- comportamento
- observações
- evolução técnica

na mesma estrutura.

---

# Arquitetura Pedagógica

O sistema separa claramente:

Cadastro

↓

Planejamento

↓

Execução

↓

Avaliação

↓

Histórico

Essa separação permite acompanhar toda a evolução do aluno.

---

# Segurança

Autenticação via JWT.

Todas as rotas protegidas utilizam middleware.

Senhas armazenadas utilizando Bcrypt.

Perfis controlam permissões.

---

# Escalabilidade

A arquitetura foi preparada para:

- PostgreSQL
- Docker
- Deploy em nuvem
- Upload de imagens
- WhatsApp
- Aplicativo Mobile
- Inteligência Artificial
- Multiacademia (SaaS)

---

# Padrões adotados

Arquitetura em Camadas

Separação de Responsabilidades

Service Layer

REST API

Prisma ORM

Componentização

Design System próprio

---

# Boas práticas

- Controllers sem regra de negócio.
- Services pequenos e especializados.
- Um arquivo por responsabilidade.
- Prisma centralizado.
- Componentes reutilizáveis.
- Tipagem forte com TypeScript.
- Organização modular.

---

# Próximas evoluções arquiteturais

- Upload de arquivos
- Cache
- Logs estruturados
- Auditoria
- Filas de processamento
- WebSockets
- Notificações
- Multiempresa
- API pública
- Integração WhatsApp

---

# Resumo

O SGCL Kids foi arquitetado para ser uma plataforma completa de gestão pedagógica e administrativa para academias de artes marciais, priorizando modularidade, organização, escalabilidade e facilidade de manutenção.

A arquitetura atual suporta a evolução do sistema para uma solução SaaS sem necessidade de reestruturações profundas.