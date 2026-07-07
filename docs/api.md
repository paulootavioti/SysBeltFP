# API REST

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Visão Geral

A API do SGCL Kids segue o padrão RESTful utilizando JSON para troca de informações entre frontend e backend.

Todas as respostas utilizam UTF-8.

Content-Type

application/json

---

# URL Base

Desenvolvimento

http://localhost:3333

Produção

https://api.sgcl.com.br

---

# Autenticação

A autenticação utiliza JWT.

Fluxo

POST /auth/login

↓

JWT

↓

Authorization

↓

Bearer Token

Exemplo

Authorization:

Bearer eyJhbGciOiJIUzI1...

---

# Perfis

ADMIN

Acesso total.

---

PROFESSOR

Acesso às funcionalidades pedagógicas.

---

RECEPCAO

Cadastro de alunos, responsáveis, financeiro.

---

# Códigos HTTP

200

Sucesso.

201

Criado.

204

Sem conteúdo.

400

Dados inválidos.

401

Não autenticado.

403

Sem permissão.

404

Não encontrado.

500

Erro interno.

---

# Formato das respostas

Sucesso

```

{
"data":{}
}

```

Erro

```

{
"message":"Descrição do erro"
}

```

---

# Autenticação

## Login

POST

/auth/login

Permissão

Pública

Body

```

{
"email":"admin@sgcl.com",
"senha":"123456"
}

```

Resposta

```

{
"usuario":{
"id":1,
"nome":"Administrador",
"perfil":"ADMIN"
},
"token":"JWT"
}

```

---

## Cadastro de usuário

POST

/auth/register

ADMIN

Body

```

{
"nome":"",
"email":"",
"senha":"",
"perfil":"ADMIN"
}

```

---

# Usuários

## Listar

GET

/usuarios

ADMIN

---

## Buscar

GET

/usuarios/:id

---

## Atualizar

PUT

/usuarios/:id

---

## Ativar/Inativar

PATCH

/usuarios/:id/ativo

---

# Alunos

## Listar

GET

/alunos

Permissões

ADMIN

PROFESSOR

RECEPCAO

---

Resposta

```

[
{
"id":1,
"nome":"Pedro"
}
]

```

---

## Buscar

GET

/alunos/:id

---

## Cadastro

POST

/alunos

Body

```

{
"nome":"Pedro",

"dataNascimento":"2016-10-08",

"telefone":"61999999999",

"turmaId":1

}

```

---

## Atualizar

PUT

/alunos/:id

---

## Ativar/Inativar

PATCH

/alunos/:id/ativo

---

## Aniversariantes

GET

/alunos/aniversariantes

---

## Prontuário

GET

/alunos/:id/prontuario

Resposta

Aluno

↓

Turma

↓

Responsáveis

↓

Resumo

↓

Comportamentos

↓

Financeiro

↓

Competições

↓

Graduações

↓

Histórico

---

# Responsáveis

## Listar

GET

/responsaveis

---

## Buscar

GET

/responsaveis/:id

---

## Criar

POST

/responsaveis

---

## Atualizar

PUT

/responsaveis/:id

---

## Ativar

PATCH

/responsaveis/:id/ativo

---

# Turmas

GET

/turmas

POST

/turmas

PUT

/turmas/:id

PATCH

/turmas/:id/ativo

---

# Aulas

## Criar aula

POST

/aulas

Body

```

{
"turmaId":1,

"professor":"Weberty"

}

```

---

## Listar

GET

/aulas

---

## Buscar

GET

/aulas/:id

---

## Atualizar aluno

PUT

/aulas/alunos/:id

Body

```

{
"presente":true,

"respeito":true,

"valentia":false,

"esforco":true,

"atencao":true,

"disciplina":true,

"observacao":"Excelente aula."

}

```

---

## Finalizar aula

PATCH

/aulas/:id/finalizar

---

# Graduações

GET

/graduacoes

POST

/graduacoes

PUT

/graduacoes/:id

GET

/graduacoes/evolucao/:alunoId

---

# Mensalidades

GET

/mensalidades

GET

/mensalidades/:id

POST

/mensalidades

PUT

/mensalidades/:id

PATCH

/mensalidades/:id/pagar

PATCH

/mensalidades/:id/cancelar

---

# Técnicas

GET

/tecnicas

POST

/tecnicas

PUT

/tecnicas/:id

PATCH

/tecnicas/:id/ativo

---

# Currículo

GET

/curriculos

POST

/curriculos

PUT

/curriculos/:id

---

# Competições

GET

/competicoes

POST

/competicoes

PUT

/competicoes/:id

DELETE

/competicoes/:id

---

# Relatórios

GET

/relatorios/dashboard

GET

/relatorios/evolucao

GET

/relatorios/ranking

GET

/relatorios/frequencia

GET

/relatorios/financeiro

---

# Dashboard

GET

/dashboard

---

# Segurança

Todas as rotas, exceto login e cadastro inicial, exigem JWT.

---

# Headers

Authorization

Bearer TOKEN

Content-Type

application/json

---

# Versionamento

Atualmente

v1

No futuro

/api/v2

---

# Boas práticas

Utilizar sempre:

GET

POST

PUT

PATCH

Nunca utilizar POST para atualização.

---

# Convenções

Plural

/alunos

/turmas

/usuarios

Nunca

/aluno

/turma

---

# Fluxo Geral

Login

↓

JWT

↓

API

↓

Service

↓

Prisma

↓

Banco

↓

JSON

---

# Roadmap

Próximos endpoints

Área dos Pais

Área do Professor

Dashboard Executivo

WhatsApp

PIX

Upload

Arquivos

Relatórios PDF

Notificações

Agenda

---

# Futuro

Esta documentação será utilizada para geração automática da especificação OpenAPI (Swagger), permitindo testes, integração com aplicações externas e manutenção simplificada da API.