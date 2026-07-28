# API REST

Versão do documento: 2.0

Última atualização: Julho/2026 (endpoints de Unidades/Arenas, Planos, Mensagens, Usuários multi-unidade, transferência de aula)

---

# Visão Geral

A API do Sys Belt - Sistema Faixa Preta segue o padrão RESTful utilizando JSON para troca de informações entre frontend e backend.

Content-Type: `application/json`

---

# URL Base

Desenvolvimento: `http://localhost:3333`

Produção: exposta via Netlify Function, acessível pelo frontend em `/api/*` (mesma origem, resolvido por redirect — ver `deploy.md`).

---

# Autenticação

A autenticação utiliza JWT.

```
POST /auth/login → JWT → Authorization: Bearer <token>
```

O token carrega apenas `sub` (id do usuário) e `perfil`. A cada requisição, `ensureAuthenticated` busca o usuário no banco (garante que `ativo` e `perfil` estão sempre atuais) e monta `req.user = { id, perfil, unidadeId }`.

## Header `X-Unidade-Id`

Alguns perfis podem alterar `req.user.unidadeId` para aquela requisição através do header `X-Unidade-Id`:

- **SUPERADMIN**: irrestrito — pode "visualizar como" qualquer unidade, ou omitir o header para ver todas.
- **ADMIN / PROFESSOR / RECEPCAO** vinculados a mais de uma unidade: só é aceito se a unidade pedida estiver entre as vinculadas ao usuário (tabela `UsuarioUnidade`) — usado para trocar a "unidade ativa".

Para qualquer outro caso o header é ignorado.

---

# Perfis

| Perfil | Resumo |
|---|---|
| **SUPERADMIN** | Acesso irrestrito a todas as unidades e telas; bypassa toda checagem de `ensureRole`. |
| **ADMIN** | Gestão completa da(s) própria(s) unidade(s). |
| **PROFESSOR** | Pedagógico, aulas, graduações, competições; dados de Aluno redigidos; pode estar vinculado a mais de uma unidade. |
| **RECEPCAO** | Cadastros, financeiro, mensalidades, mensagens, relatórios da própria unidade. |

Nas tabelas abaixo, "Perfis" lista quem passa em `ensureRole(...)` — o SUPERADMIN sempre tem acesso adicionalmente, mesmo quando não listado.

---

# Códigos HTTP

`200` Sucesso · `201` Criado · `400` Dados inválidos · `401` Não autenticado · `403` Sem permissão · `404` Não encontrado · `500` Erro interno.

---

# Formato das respostas

Sucesso: o corpo do recurso diretamente (objeto ou array), sem envelope `data`.

Erro:

```json
{ "message": "Descrição do erro" }
```

---

# Autenticação — `/auth`

## POST /auth/login

Pública.

```json
{ "email": "admin@sgcl.com", "senha": "123456" }
```

Resposta: `{ "usuario": { id, nome, email, perfil, unidadeId, unidadeNome }, "token": "JWT" }`

## POST /auth/register

Perfis: ADMIN (SUPERADMIN sempre pode).

```json
{
  "nome": "", "email": "", "senha": "", "perfil": "ADMIN",
  "unidadeId": 1,
  "unidadeIds": [1, 2]
}
```

- Um ADMIN comum sempre cadastra dentro da própria unidade (`unidadeId`/`unidadeIds` do body são ignorados).
- `unidadeIds` (mais de uma unidade) e `perfil: "SUPERADMIN"` só têm efeito quando quem cadastra já é SUPERADMIN.
- `perfil: "SUPERADMIN"` cria um usuário sem unidade.

---

# Unidades — `/unidades`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | SUPERADMIN | Cadastra unidade |
| GET | `/` | SUPERADMIN | Lista unidades (completo) |
| GET | `/opcoes` | ADMIN, PROFESSOR | Lista enxuta (id/nome) — popula o seletor de consulta de grade de outra unidade |
| PUT | `/:id` | SUPERADMIN | Atualiza unidade |
| PATCH | `/:id/ativo` | SUPERADMIN | Ativa/inativa |

---

# Arenas — `/arenas`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN | Cadastra arena na própria unidade |
| GET | `/` | ADMIN, RECEPCAO | Lista arenas da unidade |
| PUT | `/:id` | ADMIN | Atualiza (só `nome` — não permite re-vincular a outra unidade) |
| PATCH | `/:id/ativo` | ADMIN | Ativa/inativa |

---

# Usuários — `/usuarios`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/` | ADMIN | Lista usuários da unidade |
| GET | `/professores` | ADMIN, PROFESSOR | Lista enxuta de professores — usada no seletor de professor substituto |
| GET | `/minhas-unidades` | ADMIN, PROFESSOR, RECEPCAO | Unidades vinculadas ao usuário autenticado — popula o seletor de "unidade ativa" |
| PUT | `/:id` | ADMIN | Atualiza usuário (`unidadeIds` só tem efeito se quem edita é SUPERADMIN) |
| PATCH | `/:id/perfil` | ADMIN | Troca perfil (`SUPERADMIN` só pode ser concedido por outro SUPERADMIN) |
| PATCH | `/:id/ativo` | ADMIN | Ativa/inativa |

---

# Alunos — `/alunos`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN, RECEPCAO | Cadastro |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO | Lista — **redigido** para PROFESSOR (só nome/apelido/turma/responsáveis) |
| GET | `/aniversariantes` | ADMIN, RECEPCAO | Aniversariantes do mês |
| GET | `/:id/prontuario` | ADMIN, RECEPCAO | Prontuário completo (bloqueado para PROFESSOR) |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO | Detalhe — **redigido** para PROFESSOR |
| PUT | `/:id` | ADMIN, RECEPCAO | Atualiza |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO | Ativa/inativa |

Corpo do cadastro (exemplo mínimo):

```json
{ "nome": "Pedro", "dataNascimento": "2016-10-08", "telefone": "61999999999", "turmaId": 1 }
```

---

# Responsáveis — `/responsaveis`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/aluno/:alunoId` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO |
| DELETE | `/:id` | ADMIN |

---

# Turmas — `/turmas`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:turmaId/alunos/:alunoId` | ADMIN, RECEPCAO — vincula aluno à turma |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO |

PROFESSOR tem acesso somente de consulta (GET) — não cria/edita turma, nem vincula aluno.

---

# Aulas — `/aulas`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN, PROFESSOR | Inicia aula avulsa |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO | Lista aulas realizadas |
| GET | `/resumo-turmas` | ADMIN, PROFESSOR, RECEPCAO | Resumo por turma (query `periodo`) |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO | Detalhe |
| PUT | `/:id` | ADMIN, PROFESSOR | Atualiza jogos/técnicas realizadas |
| PATCH | `/:id/finalizar` | ADMIN, PROFESSOR | Finaliza a aula |
| DELETE | `/:id` | ADMIN | Remove |
| PUT | `/alunos/:id` | ADMIN, PROFESSOR | Atualiza chamada de um aluno (presença/comportamento) |
| POST | `/programadas` | ADMIN, PROFESSOR | Programa uma aula |
| POST | `/programadas/replicar` | ADMIN, PROFESSOR | Replica programação em várias datas |
| GET | `/programadas` | ADMIN, PROFESSOR, RECEPCAO | Lista programações (query `turmaId`, `periodo`, `unidadeConsultaId`) |
| GET | `/programadas/resumo-turmas` | ADMIN, PROFESSOR, RECEPCAO | Resumo por turma |
| GET | `/grade-semanal` | ADMIN, PROFESSOR, RECEPCAO | Grade da semana (query `data`, `unidadeConsultaId`) |
| PUT | `/programadas/:id` | ADMIN, PROFESSOR | Edita data/plano/observações |
| PATCH | `/programadas/:id/iniciar` | ADMIN, PROFESSOR | Vira uma Aula real (abre chamada) |
| PATCH | `/programadas/:id/cancelar` | ADMIN, PROFESSOR | Cancela |
| PATCH | `/programadas/:id/transferir` | ADMIN, PROFESSOR | Transfere para outro professor |
| DELETE | `/programadas/:id` | ADMIN | Remove |

`unidadeConsultaId` (query, em `/programadas` e `/grade-semanal`): consulta somente leitura da grade de outra unidade, disponível para ADMIN/PROFESSOR — não altera o escopo do usuário em nenhuma outra rota (mecanismo diferente do header `X-Unidade-Id`).

Corpo de `PATCH /aulas/programadas/:id/transferir`:

```json
{ "professorSubstitutoId": 7, "motivo": "Professor titular em atestado médico." }
```

---

# Currículo — `/curriculos`

| Método | Rota | Perfis |
|---|---|---|
| POST / GET / PUT `/`, `/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/modulos`, `/modulos/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/aulas`, `/aulas/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/tecnicas`, `/tecnicas/:id` | | ADMIN, PROFESSOR |
| DELETE | `/:id` | ADMIN |

---

# Técnicas — `/tecnicas`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |

---

# Comportamentos — `/comportamentos`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR |
| GET | `/resumo/:alunoId` | ADMIN, PROFESSOR |

---

# Graduações — `/graduacoes`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| POST | `/grau` | ADMIN, PROFESSOR — incrementa grau |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/aluno/:id` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/proximas` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/evolucao/:alunoId` | ADMIN, PROFESSOR, RECEPCAO |

---

# Mensalidades — `/mensalidades`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, RECEPCAO |
| GET | `/vencidas` | ADMIN, RECEPCAO |
| GET | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:id/pagar` | ADMIN |

---

# Planos — `/planos`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN |
| PATCH | `/:id/ativo` | ADMIN |

---

# Financeiro — `/financeiro`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/resumo` | ADMIN |

---

# Competições — `/competicoes`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| POST | `/inscricao` | ADMIN, PROFESSOR |
| GET | `/:id/atletas` | ADMIN, PROFESSOR, RECEPCAO |
| PATCH | `/inscricao/:id` | ADMIN, PROFESSOR — registra resultado |
| DELETE | `/:id` | ADMIN |

---

# Avisos — `/avisos`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/` | ADMIN, RECEPCAO |
| POST | `/reconhecer` | ADMIN, RECEPCAO |

---

# Mensagens — `/mensagens`

Geração de textos prontos para envio manual (WhatsApp, etc.).

| Método | Rota | Perfis |
|---|---|---|
| GET | `/lembrete-semanal` | ADMIN, RECEPCAO |
| GET | `/lembrete-vencimento` | ADMIN, RECEPCAO |
| GET | `/lembrete-atraso` | ADMIN, RECEPCAO |
| GET | `/relatorio-mensal` | ADMIN, RECEPCAO |
| GET | `/congratulacoes-graduacao` | ADMIN, RECEPCAO |
| GET | `/ausencia` | ADMIN, RECEPCAO |

---

# Relatórios — `/relatorios`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/evolucao/:alunoId` | ADMIN, RECEPCAO |
| GET | `/financeiro` | ADMIN, RECEPCAO |
| GET | `/ranking` | ADMIN, RECEPCAO |
| GET | `/aniversariantes` | ADMIN, RECEPCAO |
| GET | `/comportamental/:alunoId` | ADMIN, RECEPCAO |

---

# Dashboard — `/dashboard`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/` | ADMIN |
| GET | `/periodo` | ADMIN |

---

# Uploads — `/uploads`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR, RECEPCAO — multipart, campo `arquivo` (máx. 5MB) |
| GET | `/:prefixo/:arquivo` | qualquer autenticado |

---

# Headers

```
Authorization: Bearer <token>
Content-Type: application/json
X-Unidade-Id: <id>   (opcional — ver seção "Header X-Unidade-Id")
```

---

# Convenções

- Recursos no plural: `/alunos`, `/turmas`, `/usuarios`.
- Nunca usar POST para atualização — sempre PUT (substituição) ou PATCH (alteração parcial de estado, ex. `/ativo`).

---

# Roadmap

Próximos endpoints previstos: Área dos Pais, Área do Professor, WhatsApp, PIX, relatórios em PDF, notificações push, agenda.

---

# Futuro

Esta documentação será utilizada como base para gerar a especificação OpenAPI (Swagger), permitindo testes automatizados de contrato e integração com aplicações externas.
