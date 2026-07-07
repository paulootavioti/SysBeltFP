# Backend

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Objetivo

O backend do SGCL Kids é responsável por toda a regra de negócio da aplicação.

Nenhuma regra de negócio deve existir no frontend.

Toda validação crítica deve ocorrer no backend.

---

# Stack Tecnológica

Servidor

- Node.js

Framework

- Express

Linguagem

- TypeScript

ORM

- Prisma ORM

Banco

- SQLite (Desenvolvimento)

- PostgreSQL (Produção)

Autenticação

- JWT

Criptografia

- bcryptjs

Validação

- Zod

---

# Estrutura do Projeto

```

src/

modules/

shared/

generated/

server.ts

```

---

# Organização dos módulos

Cada módulo deve ser independente.

Exemplo:

```

modules/

alunos/

controller.ts

routes.ts

services/

schema/

types/

mappers/

utils/

```

---

# Convenções

Cada módulo possui:

Controller

↓

Service

↓

Prisma

Nunca acessar Prisma diretamente em Controllers.

---

# Controller

Responsável apenas por:

- receber Request

- ler parâmetros

- chamar Services

- devolver Response

Exemplo

```

Request

↓

Controller

↓

Service

↓

JSON

```

Controllers não possuem regras de negócio.

---

# Services

Toda regra do sistema deve ficar aqui.

Exemplos

CreateAlunoService

UpdateAlunoService

StartAulaService

FinalizarAulaService

GetProntuarioAlunoService

---

Cada Service deve possuir uma única responsabilidade.

Exemplo

✔ Correto

CreateAlunoService

❌ Errado

AlunoService

---

# Rotas

Cada módulo possui seu arquivo routes.ts.

Exemplo

```

Router

↓

Middleware

↓

Controller

```

---

Exemplo

```

router.post(

"/",

ensureAuthenticated,

ensureRole(["ADMIN"]),

controller.create

)

```

---

# Middlewares

Todos ficam em

```

shared/middlewares

```

Atualmente

ensureAuthenticated

ensureRole

errorHandler

---

## ensureAuthenticated

Responsável por:

- validar JWT

- localizar usuário

- preencher request.user

---

## ensureRole

Controla permissões.

Exemplo

```

ADMIN

PROFESSOR

RECEPCAO

```

---

## errorHandler

Captura todas exceções.

Nunca utilizar try/catch em Controllers.

Sempre lançar AppError.

---

# AppError

Todas as exceções controladas utilizam:

```

throw new AppError("Mensagem")

```

ou

```

throw new AppError(

"Mensagem",

403

)

```

---

# Prisma

Existe apenas uma instância.

```

shared/database/prisma.ts

```

Nunca criar PrismaClient dentro dos módulos.

---

# Organização das consultas

Sempre utilizar:

```

prisma.aluno.findMany()

```

Nunca utilizar SQL manual.

---

# Banco

Durante desenvolvimento

SQLite

Produção

PostgreSQL

O Prisma permite alterar apenas o provider.

---

# Migrações

Criar

```

npx prisma migrate dev

```

Atualizar Client

```

npx prisma generate

```

Abrir Studio

```

npx prisma studio

```

---

# Estrutura das Entidades

Aluno

Responsável

Turma

Usuário

Aula

AulaAluno

Mensalidade

Competição

Graduação

Currículo

Técnica

---

# Fluxo do Cadastro

POST

↓

Controller

↓

Service

↓

Prisma

↓

Banco

↓

Response

---

# Fluxo da Aula

Criar aula

↓

Selecionar turma

↓

Criar AulaAluno

↓

Professor realiza chamada

↓

Registrar comportamento

↓

Finalizar aula

↓

Atualizar evolução

---

# Fluxo da Graduação

Professor finaliza aula

↓

Presenças contabilizadas

↓

Atualizar evolução

↓

Aluno alcança grau

↓

Gerar graduação

↓

Registrar histórico

---

# Fluxo do Prontuário

Aluno

↓

Turma

↓

Responsáveis

↓

Aulas

↓

Comportamentos

↓

Financeiro

↓

Competições

↓

Resumo

---

# Estrutura dos Services

Padrão

```

export class CreateAlunoService {

async execute(data: DTO){

}

}

```

---

Nunca criar métodos estáticos.

Sempre utilizar execute().

---

# DTOs

Cada Service possui seu DTO.

Exemplo

```

interface CreateAlunoDTO {

nome: string;

}

```

Nunca utilizar any.

---

# Tipagem

Sempre utilizar interfaces.

Nunca utilizar:

```

any

```

Preferir

```

unknown

```

ou

tipos específicos.

---

# Validação

Frontend

↓

Validação visual

Backend

↓

Validação obrigatória

---

# Datas

Sempre armazenadas em UTC.

Frontend

↓

formata

Backend

↓

persiste

---

# Fotos

Estrutura preparada para:

```

fotoUrl

```

Futuramente

Upload

S3

Cloudinary

Firebase Storage

---

# Logs

Hoje

console.log

Futuro

Pino

Winston

Elastic

---

# Configurações

Variáveis ficam em

```

.env

```

Exemplo

JWT_SECRET

JWT_EXPIRES_IN

DATABASE_URL

---

# Segurança

Nunca retornar

senha

hash

JWT Secret

dados internos

---

# Organização dos arquivos

Uma classe por arquivo.

Nunca múltiplas classes.

---

# Convenções de nomes

Services

CreateAlunoService

UpdateAlunoService

DeleteAlunoService

---

Controllers

AlunosController

---

Rotas

alunosRoutes

---

Interfaces

CreateAlunoDTO

AlunoResponse

---

Enums

StatusMensalidade

PerfilUsuario

---

# Boas práticas

✔ Controllers pequenos

✔ Services especializados

✔ Prisma centralizado

✔ Sem SQL manual

✔ Sem lógica duplicada

✔ Sem any

✔ Tipagem forte

✔ Arquivos pequenos

✔ Um Service por responsabilidade

✔ Código legível

---

# Roadmap Técnico

Próximas melhorias

- Upload de imagens
- Cache Redis
- Auditoria
- Logs estruturados
- Filas
- Eventos
- WebSocket
- Notificações
- API Pública
- Multiempresa (SaaS)

---

# Conclusão

O backend do SGCL Kids foi projetado para manter uma arquitetura limpa, modular e escalável, garantindo facilidade de manutenção e evolução contínua do sistema.

Todas as novas funcionalidades devem seguir os padrões definidos neste documento para preservar a consistência do projeto.